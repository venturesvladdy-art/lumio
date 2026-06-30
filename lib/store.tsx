"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  Brief,
  LearningPlan,
  PlanTier,
  QAItem,
  SkillProgress,
  UserState,
  XpGoals,
} from "@/lib/types";
import { dayDiff, todayKey, weekKey } from "@/lib/utils";
import {
  comboBonus,
  dailyQuests,
  DEFAULT_GOALS,
  evaluateBadges,
  levelInfo,
  questProgress,
} from "@/lib/gamification";

const STORAGE_KEY = "skillsprinter.state.v1";

const INITIAL: UserState = {
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
  goals: DEFAULT_GOALS,
  streakFreezes: 2,
  quests: undefined,
  earnedBadges: [],
  skills: {},
  onboarded: false,
};

export interface AnswerResult {
  xpGained: number;
  newBadges: string[];
  leveledUp: boolean;
  combo: number;
  /** true when a streak-freeze was spent to keep the streak alive across a gap */
  freezeUsed: boolean;
  /** ids of quests this answer just completed (ready to claim) */
  questsCompleted: string[];
}

export interface QuestClaimResult {
  claimed: boolean;
  xp: number;
  newBadges: string[];
  leveledUp: boolean;
}

interface StoreValue {
  hydrated: boolean;
  state: UserState;
  setTier: (t: PlanTier) => void;
  startSkill: (plan: LearningPlan, items?: QAItem[], briefs?: Brief[]) => void;
  /** Load a fully-formed skill progress (used to resume a saved drill). */
  loadSkillProgress: (progress: SkillProgress) => void;
  recordAnswer: (skillId: string, item: QAItem, correct: boolean) => AnswerResult;
  resetAll: () => void;
  hasSkill: (skillId: string) => boolean;
  /** Set the daily/weekly XP targets (called when the intake survey completes). */
  setGoals: (goals: XpGoals) => void;
  /** Claim a completed daily quest, banking its bonus XP. */
  claimQuest: (questId: string) => QuestClaimResult;
  /** DB mode: replace the whole state with the server's authoritative copy. */
  hydrateServerState: (next: UserState) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

/** Backfill gamification fields that older stored/server states may lack. */
function withGamificationDefaults(s: UserState): UserState {
  return {
    ...s,
    dailyXp: s.dailyXp ?? 0,
    dailyCorrect: s.dailyCorrect ?? 0,
    dailyBestCombo: s.dailyBestCombo ?? 0,
    weekXp: s.weekXp ?? 0,
    weekKey: s.weekKey ?? null,
    goals: s.goals ?? DEFAULT_GOALS,
    streakFreezes: s.streakFreezes ?? 2,
  };
}

/**
 * Roll over per-day and per-week counters when the date changed, and ensure the
 * day's quests exist. Idempotent — safe to call on every read/write.
 */
function normalizePeriods(input: UserState): UserState {
  let s = withGamificationDefaults(input);
  const today = todayKey();
  const wk = weekKey();
  if (s.dailyDate !== today) {
    s = {
      ...s,
      dailyDate: today,
      dailyAnswered: 0,
      dailyXp: 0,
      dailyCorrect: 0,
      dailyBestCombo: 0,
    };
  }
  if (s.weekKey !== wk) {
    s = { ...s, weekKey: wk, weekXp: 0 };
  }
  if (!s.quests || s.quests.date !== today) {
    s = { ...s, quests: dailyQuests(today, s.goals) };
  }
  return s;
}

export function AppProvider({
  children,
  dbMode = false,
}: {
  children: React.ReactNode;
  /** When true the database is the source of truth: skip localStorage and wait
   *  for the server state (via `hydrateServerState`) before marking hydrated. */
  dbMode?: boolean;
}) {
  const [state, setState] = useState<UserState>(INITIAL);
  const [hydrated, setHydrated] = useState(false);
  const ref = useRef<UserState>(state);
  ref.current = state;

  // Hydrate from localStorage once on mount (demo mode only). In DB mode the
  // session bridge fetches /api/state and calls hydrateServerState instead, so
  // progress is tied to the account, never to this browser.
  useEffect(() => {
    if (dbMode) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserState>;
        const merged = normalizePeriods({ ...INITIAL, ...parsed });
        ref.current = merged;
        setState(merged);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, [dbMode]);

  // Persist on change to localStorage (demo mode only; DB mode persists to the
  // server through the API routes the individual actions already call).
  useEffect(() => {
    if (dbMode || !hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated, dbMode]);

  const commit = useCallback((next: UserState) => {
    ref.current = next;
    setState(next);
  }, []);

  const hydrateServerState = useCallback((next: UserState) => {
    const merged = normalizePeriods(next);
    ref.current = merged;
    setState(merged);
    setHydrated(true);
  }, []);

  const setTier = useCallback(
    (t: PlanTier) => commit({ ...ref.current, tier: t }),
    [commit]
  );

  const hasSkill = useCallback((skillId: string) => Boolean(ref.current.skills[skillId]), []);

  const startSkill = useCallback(
    (plan: LearningPlan, items: QAItem[] = [], briefs: Brief[] = []) => {
      const s = ref.current;
      const existing = s.skills[plan.skillId];
      if (existing) {
        commit({
          ...s,
          onboarded: true,
          skills: {
            ...s.skills,
            [plan.skillId]: { ...existing, plan, generatedItems: items, briefs },
          },
        });
        return;
      }
      const sp: SkillProgress = {
        skillId: plan.skillId,
        plan,
        completedItemIds: [],
        correctItemIds: [],
        xp: 0,
        combo: 0,
        bestCombo: 0,
        generatedItems: items,
        briefs,
      };
      commit({
        ...s,
        onboarded: true,
        skills: { ...s.skills, [plan.skillId]: sp },
      });
    },
    [commit]
  );

  const loadSkillProgress = useCallback(
    (progress: SkillProgress) => {
      const s = ref.current;
      commit({
        ...s,
        onboarded: true,
        skills: { ...s.skills, [progress.skillId]: progress },
      });
    },
    [commit]
  );

  const recordAnswer = useCallback(
    (skillId: string, item: QAItem, correct: boolean): AnswerResult => {
      const s = normalizePeriods(ref.current);
      const today = todayKey();
      const sp = s.skills[skillId];
      if (!sp) {
        return {
          xpGained: 0,
          newBadges: [],
          leveledUp: false,
          combo: 0,
          freezeUsed: false,
          questsCompleted: [],
        };
      }

      const already = sp.completedItemIds.includes(item.id);

      // Streak: bump once for the first activity of the day. On a short gap,
      // spend streak-freezes to keep the streak alive instead of resetting.
      let streakDays = s.streakDays;
      let lastActiveDate = s.lastActiveDate;
      let streakFreezes = s.streakFreezes;
      let freezeUsed = false;
      if (lastActiveDate !== today) {
        if (!lastActiveDate) {
          streakDays = 1;
        } else {
          const gap = dayDiff(today, lastActiveDate);
          if (gap === 1) {
            streakDays = streakDays + 1;
          } else if (gap > 1) {
            const missed = gap - 1;
            if (missed <= 2 && streakFreezes >= missed) {
              streakFreezes -= missed;
              streakDays = streakDays + 1;
              freezeUsed = true;
            } else {
              streakDays = 1;
            }
          }
        }
        lastActiveDate = today;
      }

      const newCombo = correct ? sp.combo + 1 : 0;
      const bestCombo = Math.max(sp.bestCombo, newCombo);

      const xpGained = correct && !already ? item.xp + comboBonus(newCombo) : 0;

      const completedItemIds = already
        ? sp.completedItemIds
        : [...sp.completedItemIds, item.id];
      const correctItemIds =
        correct && !sp.correctItemIds.includes(item.id)
          ? [...sp.correctItemIds, item.id]
          : sp.correctItemIds;

      const newSp: SkillProgress = {
        ...sp,
        completedItemIds,
        correctItemIds,
        combo: newCombo,
        bestCombo,
        xp: sp.xp + xpGained,
      };

      const prevLevel = levelInfo(s.xp).level;
      const newXp = s.xp + xpGained;
      const leveledUp = levelInfo(newXp).level > prevLevel;

      // Daily / weekly counters that drive the XP goals and quests.
      const before = {
        xp: s.dailyXp,
        answered: s.dailyAnswered,
        correct: s.dailyCorrect,
        bestCombo: s.dailyBestCombo,
      };
      const dailyAnswered = already ? s.dailyAnswered : s.dailyAnswered + 1;
      const after = {
        xp: s.dailyXp + xpGained,
        answered: dailyAnswered,
        correct: s.dailyCorrect + (correct && !already ? 1 : 0),
        bestCombo: Math.max(s.dailyBestCombo, newCombo),
      };

      // Quests this answer just pushed over the line (claimed on the dashboard).
      const questsCompleted =
        s.quests?.quests
          .filter(
            (q) =>
              !q.claimed &&
              questProgress(q, before) < q.target &&
              questProgress(q, after) >= q.target
          )
          .map((q) => q.id) ?? [];

      let next: UserState = {
        ...s,
        xp: newXp,
        streakDays,
        lastActiveDate,
        streakFreezes,
        dailyAnswered,
        dailyXp: after.xp,
        dailyCorrect: after.correct,
        dailyBestCombo: after.bestCombo,
        weekXp: s.weekXp + xpGained,
        skills: { ...s.skills, [skillId]: newSp },
      };

      const satisfied = evaluateBadges(next);
      const newBadges = satisfied.filter(
        (id) => !next.earnedBadges.includes(id)
      );
      if (newBadges.length) {
        next = {
          ...next,
          earnedBadges: Array.from(new Set([...next.earnedBadges, ...satisfied])),
        };
      }

      commit(next);
      return {
        xpGained,
        newBadges,
        leveledUp,
        combo: newCombo,
        freezeUsed,
        questsCompleted,
      };
    },
    [commit]
  );

  const resetAll = useCallback(() => {
    commit({ ...INITIAL, tier: ref.current.tier });
  }, [commit]);

  const setGoals = useCallback(
    (goals: XpGoals) => {
      const s = ref.current;
      // Regenerate today's quests so the XP quest scales to the new target.
      commit({ ...s, goals, quests: dailyQuests(todayKey(), goals) });
    },
    [commit]
  );

  const claimQuest = useCallback(
    (questId: string): QuestClaimResult => {
      const s = normalizePeriods(ref.current);
      const q = s.quests?.quests.find((x) => x.id === questId);
      if (!s.quests || !q || q.claimed) {
        return { claimed: false, xp: 0, newBadges: [], leveledUp: false };
      }
      const daily = {
        xp: s.dailyXp,
        answered: s.dailyAnswered,
        correct: s.dailyCorrect,
        bestCombo: s.dailyBestCombo,
      };
      if (questProgress(q, daily) < q.target) {
        return { claimed: false, xp: 0, newBadges: [], leveledUp: false };
      }
      const prevLevel = levelInfo(s.xp).level;
      const newXp = s.xp + q.xpReward;
      const quests = {
        ...s.quests,
        quests: s.quests.quests.map((x) =>
          x.id === questId ? { ...x, claimed: true } : x
        ),
      };
      let next: UserState = {
        ...s,
        xp: newXp,
        weekXp: s.weekXp + q.xpReward,
        quests,
      };
      const satisfied = evaluateBadges(next);
      const newBadges = satisfied.filter((id) => !next.earnedBadges.includes(id));
      if (newBadges.length) {
        next = {
          ...next,
          earnedBadges: Array.from(new Set([...next.earnedBadges, ...satisfied])),
        };
      }
      commit(next);
      return {
        claimed: true,
        xp: q.xpReward,
        newBadges,
        leveledUp: levelInfo(newXp).level > prevLevel,
      };
    },
    [commit]
  );

  const value: StoreValue = {
    hydrated,
    state,
    setTier,
    startSkill,
    loadSkillProgress,
    recordAnswer,
    resetAll,
    hasSkill,
    setGoals,
    claimQuest,
    hydrateServerState,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within an AppProvider");
  }
  return ctx;
}
