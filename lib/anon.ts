"use client";

/**
 * Anonymous progress for the guest taste (Proposal §2.5 / Phase 3). A guest's
 * result is stashed in localStorage under a random anonId; after they create an
 * account the ClaimBridge POSTs it to /api/claim, which merges a capped welcome
 * bonus into the new account, once. Nothing here is trusted server-side — the
 * claim re-derives XP from the real bank and caps it.
 */

const SNAP_KEY = "sprinter.anon.v1";
const ID_KEY = "sprinter.anonId.v1";

export interface AnonSnapshot {
  anonId: string;
  skillId: string;
  level: string;
  /** taste-bank question ids the guest answered correctly */
  correctIds: string[];
  /** the guest's local XP (advisory only — server re-derives from the bank) */
  xp: number;
  streak: number;
}

function browser(): boolean {
  return typeof window !== "undefined";
}

/** Stable per-browser anonymous id (created on first use). */
export function getAnonId(): string {
  if (!browser()) return "anon";
  let id = localStorage.getItem(ID_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `anon-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    localStorage.setItem(ID_KEY, id);
  }
  return id;
}

export function savePendingClaim(s: AnonSnapshot): void {
  if (!browser()) return;
  try {
    localStorage.setItem(SNAP_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota / disabled storage */
  }
}

export function readPendingClaim(): AnonSnapshot | null {
  if (!browser()) return null;
  try {
    const raw = localStorage.getItem(SNAP_KEY);
    return raw ? (JSON.parse(raw) as AnonSnapshot) : null;
  } catch {
    return null;
  }
}

export function clearPendingClaim(): void {
  if (!browser()) return;
  try {
    localStorage.removeItem(SNAP_KEY);
  } catch {
    /* ignore */
  }
}
