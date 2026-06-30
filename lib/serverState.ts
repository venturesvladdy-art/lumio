import { prisma } from "@/lib/db";
import { resolveSkill } from "@/lib/skills";
import { assemblePlan, assembleDrill } from "@/lib/agent";
import { evaluateBadges } from "@/lib/gamification";
import { getCachedTaxonomy } from "@/lib/taxonomy";
import {
  clampTarget,
  creditedConceptsFor,
  levelForFraction,
  standing,
  startLevelFor,
} from "@/lib/mastery";
import { proficiencyFromAnswers } from "@/lib/survey/profile";
import { dayDiff } from "@/lib/utils";
import type {
  AreaCoverage,
  Brief,
  Difficulty,
  PlanTier,
  QAFormat,
  QAItem,
  SkillMastery,
  SkillProgress,
  SubareaMastery,
  UserState,
} from "@/lib/types";
import type { SurveyAnswers } from "@/lib/survey/types";

const EMPTY_STATE: UserState = {
  tier: "basic",
  xp: 0,
  streakDays: 0,
  lastActiveDate: null,
  dailyAnswered: 0,
  dailyDate: null,
  dailyXp: 0,
  dailyCorrect: 0,
  dailyBestCombo: 0,
  weekXp: 0,
  weekKey: null,
  goals: { dailyXp: 40, weeklyXp: 200 },
  streakFreezes: 2,
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
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        tier: true,
        subareaLevels: true,
        pendingTier: true,
        currentPeriodEnd: true,
      },
    }),
    prisma.curriculum.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        questions: { orderBy: { orderIndex: "asc" } },
        briefs: { orderBy: { orderIndex: "asc" } },
      },
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
      subareaKey: q.subareaKey ?? undefined,
      concept: q.concept ?? undefined,
      difficulty: q.difficulty as Difficulty,
      format: (q.type as QAFormat) ?? "mcq",
      question: { en: q.questionEn, pl: q.questionPl },
      options: { en: q.optionsEn, pl: q.optionsPl },
      correctIndex: q.correctIndex,
      answerText: q.answerText ?? undefined,
      acceptedAnswers: q.acceptedAnswers ?? [],
      orderItems: q.orderItems ?? [],
      correctOrder: q.correctOrder ?? [],
      rubric: q.rubric ?? undefined,
      briefClientId: q.briefClientId ?? undefined,
      explanation: { en: q.explanationEn, pl: q.explanationPl },
      xp: q.xp,
    }));

    const briefs: Brief[] = c.briefs.map((b) => ({
      clientId: b.clientId,
      title: b.title,
      body: b.body,
      orderIndex: b.orderIndex,
    }));

    const plan = c.areaName
      ? assembleDrill({
          skillId,
          level: c.level as Difficulty,
          focusValues: c.focus,
          summary: { en: c.summaryEn, pl: c.summaryPl },
          items,
          areaId: c.areaId ?? undefined,
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
      briefs,
    };
  }

  // Replay attempts (chronological) into per-skill progress + totals.
  // Use one consistent (UTC) day key for bucketing and "today".
  let totalXp = 0;
  const today = dayOf(new Date());
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

  // ---- Area coverage (Stage B): group every drilled area across curricula ----
  const currToArea = new Map<string, string>(); // curriculumId → "skill::area"
  const areaInfo = new Map<
    string,
    { skillId: string; areaId: string; areaName: string; questionIds: Set<string> }
  >();
  for (const c of curricula) {
    if (!c.areaId) continue;
    const key = `${c.skillId}::${c.areaId}`;
    currToArea.set(c.id, key);
    let info = areaInfo.get(key);
    if (!info) {
      info = {
        skillId: c.skillId,
        areaId: c.areaId,
        areaName: c.areaName ?? c.areaId,
        questionIds: new Set(),
      };
      areaInfo.set(key, info);
    }
    info.areaName = c.areaName ?? info.areaName; // newest name wins
    for (const q of c.questions) info.questionIds.add(q.clientId);
  }

  const areaAnswered = new Map<string, { answered: Set<string>; correct: Set<string> }>();
  for (const a of attempts) {
    const key = a.curriculumId ? currToArea.get(a.curriculumId) : undefined;
    if (!key) continue;
    let e = areaAnswered.get(key);
    if (!e) {
      e = { answered: new Set(), correct: new Set() };
      areaAnswered.set(key, e);
    }
    e.answered.add(a.questionClientId);
    if (a.correct) e.correct.add(a.questionClientId);
  }

  const coverage: Record<string, AreaCoverage[]> = {};
  for (const [key, info] of areaInfo) {
    const e = areaAnswered.get(key);
    (coverage[info.skillId] ??= []).push({
      areaId: info.areaId,
      areaName: info.areaName,
      total: info.questionIds.size,
      answered: e?.answered.size ?? 0,
      correct: e?.correct.size ?? 0,
    });
  }

  const state: UserState = {
    tier,
    xp: totalXp,
    streakDays,
    lastActiveDate,
    dailyAnswered,
    dailyDate: today,
    dailyXp: 0,
    dailyCorrect: 0,
    dailyBestCombo: 0,
    weekXp: 0,
    weekKey: null,
    goals: { dailyXp: 40, weeklyXp: 200 },
    streakFreezes: 2,
    earnedBadges: [],
    skills,
    onboarded: Object.keys(skills).length > 0,
    coverage,
    billing: {
      pendingTier: (user?.pendingTier as PlanTier | null) ?? null,
      periodEnd: user?.currentPeriodEnd ? user.currentPeriodEnd.toISOString() : null,
    },
  };
  state.earnedBadges = evaluateBadges(state);

  // ---- v2: subarea mastery levels (concept-deduped, survey-seeded) ----
  // Distinct mastered concepts + distinct answered/correct questions per subarea.
  const masteredBySub = new Map<string, Set<string>>();
  const answeredBySub = new Map<string, Set<string>>();
  const correctBySub = new Map<string, Set<string>>();
  const add = (m: Map<string, Set<string>>, key: string, v: string) => {
    let s = m.get(key);
    if (!s) {
      s = new Set();
      m.set(key, s);
    }
    s.add(v);
  };
  for (const a of attempts) {
    const sub = a.subareaKey;
    if (!sub) continue;
    const key = `${a.skillId}::${sub}`;
    add(answeredBySub, key, a.questionClientId);
    if (a.correct) add(correctBySub, key, a.questionClientId);
    if (a.correct && a.concept) add(masteredBySub, key, a.concept);
  }

  // The learner's self-proclaimed level applies to EVERY subarea of a skill,
  // taken from the earliest (onboarding) curriculum's survey answers.
  const skillDefaultProf = new Map<string, number>();
  for (const c of curricula) {
    if (!skillDefaultProf.has(c.skillId) && c.answers) {
      skillDefaultProf.set(c.skillId, proficiencyFromAnswers(c.answers as SurveyAnswers));
    }
  }
  // Manual per-subarea overrides (never Expert).
  const overrides = (user?.subareaLevels ?? {}) as Record<string, string>;
  const asMasteryStart = (lvl: string | undefined) =>
    lvl === "beginner" || lvl === "intermediate" || lvl === "advanced"
      ? (lvl as "beginner" | "intermediate" | "advanced")
      : undefined;

  const touchedSkills = new Set<string>([
    ...Object.keys(skills),
    ...attempts.map((a) => a.skillId),
  ]);
  const mastery: Record<string, SkillMastery> = {};
  for (const skillId of touchedSkills) {
    const tax = await getCachedTaxonomy(resolveSkill(skillId));
    if (!tax) continue;
    const defaultStart = startLevelFor(skillDefaultProf.get(skillId) ?? 0);
    let sumEff = 0;
    let sumTarget = 0;
    const subList: SubareaMastery[] = [];
    for (const area of tax.areas) {
      for (const sub of area.subareas) {
        const key = `${skillId}::${sub.subareaKey}`;
        const masteredConcepts = masteredBySub.get(key)?.size ?? 0;
        const startLevel = asMasteryStart(overrides[sub.subareaKey]) ?? defaultStart;
        const target = clampTarget(sub.conceptTarget);
        const st = standing(masteredConcepts, startLevel, target);
        subList.push({
          subareaKey: sub.subareaKey,
          areaKey: area.areaKey,
          name: sub.name,
          masteredConcepts,
          creditedConcepts: creditedConceptsFor(startLevel, target),
          conceptTarget: target,
          level: st.level,
          startLevel,
          pctToNext: st.pctToNext,
          answered: answeredBySub.get(key)?.size ?? 0,
          correct: correctBySub.get(key)?.size ?? 0,
        });
        sumEff += st.effectiveMastered;
        sumTarget += st.target;
      }
    }
    const frac = sumTarget > 0 ? sumEff / sumTarget : 0;
    mastery[skillId] = {
      skillId,
      level: levelForFraction(frac),
      pct: Math.round(frac * 100),
      subareas: subList,
    };
  }
  state.mastery = mastery;

  return state;
}
