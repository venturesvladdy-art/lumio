import { levelInfo } from "@/lib/gamification";

/**
 * Static "rivals" that populate the leaderboard so it never feels empty. These
 * are decorative demo players — the real signed-in learner is spliced in by XP
 * at render time (see buildLeaderboard). Numbers are fixed (no randomness) so
 * ranks are stable across reloads.
 */
export interface LeaderboardPlayer {
  id: string;
  name: string;
  emoji: string; // avatar
  weeklyXp: number;
  totalXp: number;
  streak: number;
}

export const FAKE_PLAYERS: LeaderboardPlayer[] = [
  { id: "p-maya", name: "Maya", emoji: "🦊", weeklyXp: 820, totalXp: 4120, streak: 31 },
  { id: "p-diego", name: "Diego", emoji: "🐯", weeklyXp: 690, totalXp: 3360, streak: 22 },
  { id: "p-aisha", name: "Aisha", emoji: "🦉", weeklyXp: 640, totalXp: 2890, streak: 18 },
  { id: "p-lars", name: "Lars", emoji: "🐺", weeklyXp: 560, totalXp: 2510, streak: 12 },
  { id: "p-yuki", name: "Yuki", emoji: "🦄", weeklyXp: 510, totalXp: 3010, streak: 26 },
  { id: "p-priya", name: "Priya", emoji: "🦋", weeklyXp: 470, totalXp: 1980, streak: 9 },
  { id: "p-sofia", name: "Sofia", emoji: "🐬", weeklyXp: 360, totalXp: 2240, streak: 14 },
  { id: "p-tom", name: "Tom", emoji: "🐢", weeklyXp: 420, totalXp: 1460, streak: 5 },
  { id: "p-omar", name: "Omar", emoji: "🦅", weeklyXp: 300, totalXp: 1170, streak: 7 },
  { id: "p-noah", name: "Noah", emoji: "🐙", weeklyXp: 190, totalXp: 1540, streak: 11 },
  { id: "p-lena", name: "Lena", emoji: "🐼", weeklyXp: 250, totalXp: 880, streak: 4 },
  { id: "p-kenji", name: "Kenji", emoji: "🐝", weeklyXp: 140, totalXp: 620, streak: 3 },
  { id: "p-mara", name: "Mara", emoji: "🐲", weeklyXp: 95, totalXp: 410, streak: 2 },
  { id: "p-ben", name: "Ben", emoji: "🦁", weeklyXp: 60, totalXp: 300, streak: 1 },
];

export type LeaderboardScope = "weekly" | "allTime";

export interface LeaderboardRow extends LeaderboardPlayer {
  rank: number;
  level: number;
  isUser: boolean;
  score: number; // the value being ranked on, for this scope
}

export interface UserLeaderboardEntry {
  name: string;
  emoji: string;
  weeklyXp: number;
  totalXp: number;
  streak: number;
}

/**
 * Merge the real learner into the rivals and rank by the chosen scope's XP.
 * Ties break by total XP so ordering is deterministic.
 */
export function buildLeaderboard(
  user: UserLeaderboardEntry,
  scope: LeaderboardScope
): LeaderboardRow[] {
  const all: (LeaderboardPlayer & { isUser: boolean })[] = [
    ...FAKE_PLAYERS.map((p) => ({ ...p, isUser: false })),
    { id: "me", ...user, isUser: true },
  ];
  const score = (p: LeaderboardPlayer) =>
    scope === "weekly" ? p.weeklyXp : p.totalXp;

  return all
    .sort((a, b) => score(b) - score(a) || b.totalXp - a.totalXp)
    .map((p, i) => ({
      ...p,
      rank: i + 1,
      level: levelInfo(p.totalXp).level,
      score: score(p),
    }));
}
