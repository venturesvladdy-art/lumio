import { prisma } from "@/lib/db";
import { resolveSkill } from "@/lib/skills";
import { assemblePlan, assembleDrill } from "@/lib/agent";
import { evaluateBadges } from "@/lib/gamification";
import { todayKey, dayDiff } from "@/lib/utils";
import type {
  Difficulty,
  PlanTier,
  QAItem,
  SkillProgress,
  UserState,
} from "@/lib/types";

const EMPTY_STATE: UserState = {
  tier: "basic",
  xp: 0,
  streakDays: 0,
  lastActiveDate: null,
  dailyAnswered: 0,
  dailyDate: null,
  earnedBadges: [],
  skills: {},
  onboarded: false,
};

/** UTC day key for an attempt timestamp (stable on the server). */
function dayOf(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Rebuild the full client UserState from the database — the authoritative
 * source of truth in DB mode. Curricula become skills (with their plan + Q&A),
 * and the append-only Attempt log is replayed into progress, XP, streaks and
 * badges. Mirrors the client store's accounting closely enough that the
 * dashboard and sessions render identically after a reload or on a new device.
 */
export async function reconstructUserState(userId: string): Promise<UserState> {
  if (!prisma) return EMPTY_STATE;

  const [user, curricula, attempts] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { tier: true } }),
    prisma.curriculum.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { questions: { orderBy: { orderIndex: "asc" } } },
    }),
    prisma.attempt.findMany({
      where: { userId },
      orderBy: { answeredAt: "asc" },
    }),
  ]);

  const tier = (user?.tier as PlanTier) ?? "basic";

  // Latest curriculum per skill wins (immutable design: newest is current).
  const latestBySkill = new Map<string, (typeof curricula)[number]>();
  for (const c of curricula) latestBySkill.set(c.skillId, c); // asc order → last wins

  const skills: Record<string, SkillProgress> = {};
  for (const [skillId, c] of latestBySkill) {
    const items: QAItem[] = c.questions.map((q) => ({
      id: q.clientId,
      skillId: q.skillId,
      difficulty: q.difficulty as Difficulty,
      format: "mcq",
      question: { en: q.questionEn, pl: q.questionPl },
      options: { en: q.optionsEn, pl: q.optionsPl },
      correctIndex: q.correctIndex,
      explanation: { en: q.explanationEn, pl: q.explanationPl },
      xp: q.xp,
    }));

    const plan = c.areaName
      ? assembleDrill({
          skillId,
          level: c.level as Difficulty,
          focusValues: c.focus,
          summary: { en: c.summaryEn, pl: c.summaryPl },
          items,
          areaName: c.areaName,
          createdAt: c.createdAt.getTime(),
        })
      : assemblePlan({
          skillId,
          level: c.level as Difficulty,
          focusValues: c.focus,
          summary: { en: c.summaryEn, pl: c.summaryPl },
          items,
          createdAt: c.createdAt.getTime(),
        });

    skills[skillId] = {
      skillId,
      plan,
      completedItemIds: [],
      correctItemIds: [],
      xp: 0,
      combo: 0,
      bestCombo: 0,
      generatedItems: items,
    };
  }

  // Replay attempts (chronological) into per-skill progress + totals.
  let totalXp = 0;
  const today = todayKey();
  let dailyAnswered = 0;
  const activeDays = new Set<string>();

  for (const a of attempts) {
    totalXp += a.xpGained;
    const day = dayOf(a.answeredAt);
    activeDays.add(day);
    if (day === today) dailyAnswered += 1;

    const sp = skills[a.skillId];
    if (!sp) continue; // attempt for a skill with no current curriculum

    const firstTime = !sp.completedItemIds.includes(a.questionClientId);
    if (firstTime) sp.completedItemIds.push(a.questionClientId);
    if (a.correct && !sp.correctItemIds.includes(a.questionClientId)) {
      sp.correctItemIds.push(a.questionClientId);
    }
    sp.xp += a.xpGained;
    sp.combo = a.correct ? sp.combo + 1 : 0;
    sp.bestCombo = Math.max(sp.bestCombo, sp.combo);
  }
  // `combo` is a live counter; it shouldn't persist across reloads.
  for (const sp of Object.values(skills)) sp.combo = 0;

  // Streak: length of the consecutive-day run ending on the last active day.
  const sortedDays = Array.from(activeDays).sort();
  let streakDays = 0;
  let lastActiveDate: string | null = null;
  if (sortedDays.length > 0) {
    lastActiveDate = sortedDays[sortedDays.length - 1];
    streakDays = 1;
    for (let i = sortedDays.length - 1; i > 0; i--) {
      if (dayDiff(sortedDays[i], sortedDays[i - 1]) === 1) streakDays += 1;
      else break;
    }
    // If the last activity wasn't today or yesterday, the streak has lapsed.
    if (dayDiff(today, lastActiveDate) > 1) streakDays = 0;
  }

  const state: UserState = {
    tier,
    xp: totalXp,
    streakDays,
    lastActiveDate,
    dailyAnswered,
    dailyDate: today,
    earnedBadges: [],
    skills,
    onboarded: Object.keys(skills).length > 0,
  };
  state.earnedBadges = evaluateBadges(state);

  return state;
}
