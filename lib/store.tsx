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
  LearningPlan,
  PlanTier,
  QAItem,
  SkillProgress,
  UserState,
} from "@/lib/types";
import { dayDiff, todayKey } from "@/lib/utils";
import { comboBonus, evaluateBadges, levelInfo } from "@/lib/gamification";

const STORAGE_KEY = "skillsprinter.state.v1";

const INITIAL: UserState = {
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

export interface AnswerResult {
  xpGained: number;
  newBadges: string[];
  leveledUp: boolean;
  combo: number;
}

interface StoreValue {
  hydrated: boolean;
  state: UserState;
  setTier: (t: PlanTier) => void;
  startSkill: (plan: LearningPlan, items?: QAItem[]) => void;
  recordAnswer: (skillId: string, item: QAItem, correct: boolean) => AnswerResult;
  resetAll: () => void;
  hasSkill: (skillId: string) => boolean;
  /** DB mode: replace the whole state with the server's authoritative copy. */
  hydrateServerState: (next: UserState) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

/** Reset the per-day counter if the stored day is not today. */
function normalizeDaily(s: UserState): UserState {
  const today = todayKey();
  if (s.dailyDate !== today) {
    return { ...s, dailyDate: today, dailyAnswered: 0 };
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
        const merged = normalizeDaily({ ...INITIAL, ...parsed });
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
    const merged = normalizeDaily(next);
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
    (plan: LearningPlan, items: QAItem[] = []) => {
      const s = ref.current;
      const existing = s.skills[plan.skillId];
      if (existing) {
        commit({
          ...s,
          onboarded: true,
          skills: {
            ...s.skills,
            [plan.skillId]: { ...existing, plan, generatedItems: items },
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
      };
      commit({
        ...s,
        onboarded: true,
        skills: { ...s.skills, [plan.skillId]: sp },
      });
    },
    [commit]
  );

  const recordAnswer = useCallback(
    (skillId: string, item: QAItem, correct: boolean): AnswerResult => {
      const s = normalizeDaily(ref.current);
      const today = todayKey();
      const sp = s.skills[skillId];
      if (!sp) {
        return { xpGained: 0, newBadges: [], leveledUp: false, combo: 0 };
      }

      const already = sp.completedItemIds.includes(item.id);

      // Streak: bump once for the first activity of the day.
      let streakDays = s.streakDays;
      let lastActiveDate = s.lastActiveDate;
      if (lastActiveDate !== today) {
        streakDays =
          lastActiveDate && dayDiff(today, lastActiveDate) === 1
            ? streakDays + 1
            : 1;
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
      const dailyAnswered = already ? s.dailyAnswered : s.dailyAnswered + 1;

      let next: UserState = {
        ...s,
        xp: newXp,
        streakDays,
        lastActiveDate,
        dailyAnswered,
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
      return { xpGained, newBadges, leveledUp, combo: newCombo };
    },
    [commit]
  );

  const resetAll = useCallback(() => {
    commit({ ...INITIAL, tier: ref.current.tier });
  }, [commit]);

  const value: StoreValue = {
    hydrated,
    state,
    setTier,
    startSkill,
    recordAnswer,
    resetAll,
    hasSkill,
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
