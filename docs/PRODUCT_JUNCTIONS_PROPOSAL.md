# SkillSprinter / Lumio — Product Junctions, Features & Cost Proposal

**Status:** proposal, ready for an AI agent to execute in phases.
**Author:** QA/Product audit, 2026-06-25.
**Primary goal:** maximize sign-ups → activation → paid conversion, while holding AI cost to **≤ 20 % of revenue** on paid tiers and **≈ $0** on anonymous traffic.

This document defines, for each of the five user junctions, exactly what is **displayed**, what **functionality/features** are available, what the **dashboard** shows, how **AI cost** is governed, and what **security/controls** apply. It also specifies the four new architectural seams that make it work, the data-model and API changes, the cost model with real Claude pricing, and a phased build plan with acceptance criteria.

It is written against the current codebase (Next.js 15 App Router, Prisma/Neon, Auth.js v5, Stripe, Anthropic SDK). File and symbol references are real.

---

## 0. TL;DR — the five decisions

1. **Let anonymous users play immediately** (no login wall) on a **prebuilt bank** of Q&A + theory → **$0 AI** for non-signed-in traffic. This is both the top conversion lever and the top cost lever.
2. **Build a large Content Bank offline** (batch API, −50 %) once (~$70 for 20k Q). Serve it forever at ~$0. Anonymous + most Basic usage = bank only. Paid tiers get live personalization on top.
3. **Govern live AI with a per-user budget ledger** sized at **20 % of that user's revenue** ($0.15 Basic promo / $2.00 Smart / $8.00 Guru per month). When the budget is spent, routing falls back to the bank — the product still works, it just stops generating fresh. This makes "20 % AI cost" true *by construction*.
4. **Move gating server-side** (daily limit, skill cap, tier, email-verified). Today every limit is client-only and bypassable; that has to change before any of this is monetizable.
5. **Migrate anonymous progress on sign-up** via a one-time, capped, server-side **claim** so the "no account needed" promise and the "your progress follows you" promise are both true.

---

## 1. Junction matrix (the spec at a glance)

| Capability | 1. Anonymous | 2. Logged-in, **unverified** | 3. Basic (verified) | 4. Smart | 5. Guru |
|---|---|---|---|---|---|
| Browse landing / skills / pricing | ✓ | ✓ | ✓ | ✓ | ✓ |
| Start a learning session | ✓ (1 skill, bank) | ✓ (1 skill, bank) | ✓ (1 skill) | ✓ (∞ skills) | ✓ (∞ skills) |
| Questions / day | 5 (bank) | 3 (bank) | 5 | 20 | ∞ (fair-use) |
| Skills (concurrent) | 1 | 1 | 1 | ∞ | ∞ |
| Source of questions | **Bank only** | **Bank only** | Bank + **1 live drill/day** | **Live‑personalized** (budget) → bank | **Live‑personalized** (budget) → bank |
| On-demand theory | Bank-cached only | Bank-cached only | Bank-cached only | Live (Haiku→Sonnet) | Live (Haiku→Sonnet) |
| AI free-text grading | ✗ (MCQ/numeric only) | ✗ | ✗ | ✓ | ✓ |
| Adaptive continuation ("keep going") | ✗ | ✗ | Limited | ✓ | ✓ |
| Dashboard | Teaser (local) | Basic + verify nudge | Basic | Full + tracking | Advanced |
| Progress tracking / accuracy / mastery | Local, ephemeral | Local→claimed | XP/streak only; mastery **teased** | ✓ | ✓ advanced |
| Pay / upgrade | CTA → register | CTA → **verify first** | ✓ | manage / change | manage / change |
| Per-user AI budget / mo | $0 (IP-rate-limited) | $0 | ~$0.15 (promo) | **$2.00** | **$8.00** (mo) / $5.83 (yr) |
| Server-enforced limits | IP rate limit | tier+verify+budget | tier+budget | tier+budget | budget (fair-use) |

> "Bank only" means **no live Anthropic call is ever made for this user.** The only AI those tiers can trigger (theory) is served from a per-question cache populated by the offline build.

---

## 2. New architectural seams

These four additions are the backbone. Everything in §3 builds on them.

### 2.1 Anonymous "try-before-signup" mode

**Problem today:** `NEXT_PUBLIC_USE_DB=true` disables the localStorage demo path, so `useRequireAuth()` ([lib/session.tsx](../lib/session.tsx)) redirects to `/login?next=` the instant a logged-out visitor opens `/learn/[skill]`. No one tastes the product before creating an account.

**Change:** introduce a third state — *anonymous-with-local-state* — that is allowed in DB mode.

- Add `useOptionalAuth()` alongside `useRequireAuth()` in [lib/session.tsx](../lib/session.tsx). The learn/session pages use the optional variant; only **save/persist/upgrade** actions require auth.
- Anonymous users run the existing local store ([lib/store.tsx](../lib/store.tsx)) under an `anonId` (a random id in `localStorage["sprinter.anon.v1"]`).
- Anonymous question source is **always the bank** (§2.2). The client calls a new `GET /api/bank/drill?skillId&areaId&level&n` — **no auth, no live AI, IP-rate-limited.** It never touches `/api/generate-plan`.
- After the anonymous user answers **5 questions** *or* completes their first module *or* earns their first badge, show a non-blocking **"Save your progress — create a free account (no card)"** interstitial. This is the primary signup driver.

**Why:** turns the funnel from *land → wall* into *land → win → save*. Costs nothing because anonymous = bank only.

### 2.2 The Content Bank (prebuilt Q&A + Theory)

**Goal:** a large, reusable, multi-difficulty, bilingual question + theory bank, generated **once** with the batch API and served forever at ~$0. It backs anonymous, unverified, Basic, and the budget-exhausted state of paid tiers.

**Data model (new Prisma models — additive, no breaking changes):**

```prisma
/// Reusable, curated/generated content shared across ALL users. Built offline.
model BankQuestion {
  id           String   @id @default(cuid())
  skillId      String                 // "sat", "gmat", "ai", ... (matches resolveSkill ids)
  subareaKey   String                 // taxonomy subareaKey (lib/taxonomy.ts)
  concept      String                 // kebab-case canonical concept (mastery dedup)
  difficulty   String                 // beginner | intermediate | advanced
  type         String   @default("mcq") // mcq | truefalse | numeric | input | order | free
  questionEn   String   @db.Text
  questionPl   String   @db.Text
  optionsEn    String[]
  optionsPl    String[]
  correctIndex Int
  answerText   String?  @db.Text       // numeric/free canonical answer
  acceptedAnswers String[] @default([])
  orderItems   String[] @default([])
  correctOrder Int[]    @default([])
  explanationEn String  @db.Text
  explanationPl String  @db.Text
  theoryEn     String?  @db.Text       // pre-generated theory (bank theory; Haiku batch)
  theoryPl     String?  @db.Text
  xp           Int
  qualityState String   @default("approved") // draft | approved | retired
  model        String?                 // model id that produced it
  buildBatchId String?                 // ties to a build run for auditing
  createdAt    DateTime @default(now())

  @@index([skillId, subareaKey, difficulty])
  @@index([skillId, concept])
  @@index([qualityState])
}
```

**Offline build pipeline (new, not in the request path):**

- A script `scripts/build-bank.ts` (run via `npm run bank:build`) walks the taxonomy ([lib/taxonomy.ts](../lib/taxonomy.ts)) for each predefined skill → area → subarea, and for each (subarea × difficulty) submits a **Message Batches** request (`POST /v1/messages/batches`, 50 % off) asking `claude-opus-4-8` for N questions using the **existing, already-good** prompt and schema in [lib/planGen.ts](../lib/planGen.ts) (`SYSTEM`, `QUESTION_SET_SCHEMA`, `normalizeQuestion`).
- A second batch pass generates **theory** per question with `claude-haiku-4-5` (the same `THEORY_MODEL` path from [lib/aiModel.ts](../lib/aiModel.ts)).
- **Validation gate before `qualityState="approved"`:** every item must pass `normalizeQuestion` *plus* a new **answer-key self-check** (a cheap second model verifies the keyed answer is correct — closes the "wrong key shipped confidently" risk found in the audit). Items that fail are stored `draft` for human review, never served.
- Polish: generate natively in both languages in the same batch (the schema already carries `pl`), rather than copying EN→PL as the live path currently does.

**Sizing & cost (real pricing, batch −50 %):** 5 skills × ~4 areas × ~4 subareas × 3 difficulties × ~80 Q ≈ **~19k questions ≈ ~$70** one-time + ~$30 theory. A 100k-question bank ≈ **~$350**. Rebuild/extend monthly as a cron. **Serving cost = a Postgres read = $0.**

**Serving:** `GET /api/bank/drill` selects N approved questions for `(skillId, subareaKey, level)` ordered by difficulty ramp, excluding any `concept` the user has already mastered (for logged-in users; anonymous gets a rotating slice keyed off `anonId` so repeats are rare). This replaces the current 6-item `lib/content.ts` fallback ([lib/agent.ts](../lib/agent.ts) `buildBankPlan`).

### 2.3 Per-user AI Budget Ledger (enforces the 20 % target)

**Goal:** make "AI cost ≤ 20 % of revenue" a hard invariant, and decide live-vs-bank routing per request.

**Data model:**

```prisma
/// Append-only AI spend ledger. One row per live model call.
model AiUsage {
  id          String   @id @default(cuid())
  userId      String?                 // null = anonymous (should be ~empty; anon is bank-only)
  kind        String                  // plan | theory | grade | taxonomy | areas | bank-build
  model       String
  inputTokens Int
  outputTokens Int
  cachedInputTokens Int @default(0)
  costUsd     Float                   // computed from usage + price table
  period      String                  // "YYYY-MM" for fast monthly rollup
  createdAt   DateTime @default(now())

  @@index([userId, period])
  @@index([period, kind])
}
```

**`lib/budget.ts` (new):**

```ts
export const MONTHLY_BUDGET_USD: Record<PlanTier, number> = {
  basic: 0.15,   // promotional "taste of AI"
  smart: 2.00,   // 20% of $10
  guru:  8.00,   // 20% of $40/mo  (annual Guru auto-derives 5.83 from currentPeriod)
};
export async function remainingBudget(userId, tier): Promise<number> // budget − sum(costUsd this period)
export async function recordUsage(userId, kind, model, usage): Promise<void> // writes AiUsage from response.usage
export function priceFor(model): {in:number,out:number,cacheRead:number} // $/token table below
```

**Price table (authoritative, $/1M tokens):**

| Model | id | input | output | cache read (~0.1×) |
|---|---|---|---|---|
| Opus 4.8 | `claude-opus-4-8` | $5.00 | $25.00 | $0.50 |
| Sonnet 4.6 | `claude-sonnet-4-6` | $3.00 | $15.00 | $0.30 |
| Haiku 4.5 | `claude-haiku-4-5` | $1.00 | $5.00 | $0.10 |

Batch API = −50 % on both directions (used only for the offline build).

**Routing rule (used by every AI route):**

```
canGoLive = isVerified(user)
         && tierAllowsLive(tier, kind)        // see junction matrix
         && remainingBudget(user,tier) > estCost(kind, model)
if canGoLive: generate live (Opus for paid, Sonnet for Basic's daily live drill), then recordUsage()
else:         serve from BankQuestion (graceful, $0)  // never a dead end
```

This is what makes Guru "unlimited" affordable: unlimited *questions*, but live *generation* tapers to the bank once the $8 is spent. Users still get unlimited practice; only the freshness degrades, invisibly.

### 2.4 Server-side entitlement enforcement

**Problem today (from audit):** the 5/20-per-day cap, the 1-skill cap, tier, and `emailVerified` are all enforced only in React ([lib/plans.ts](../lib/plans.ts), [app/learn/[skill]/page.tsx](../app/learn/%5Bskill%5D/page.tsx)). `/api/attempt`, `/api/generate-plan`, `/api/theory`, `/api/grade` enforce none of it; XP/`correct` are client-authored.

**Change — a single guard used by every protected route**, `lib/entitlement.ts`:

```ts
export async function requireEntitlement(req, {
  needVerified = false,      // gate AI + checkout on emailVerified
  countsTowardDaily = false, // attempt/generate-plan decrement the server daily counter
  kind,                      // for budget + tier routing
}): Promise<{ userId, tier, verified, remainingToday, goLive }>
```

- Daily count is derived **server-side** from the `Attempt` table for the user's **local day** (fix the UTC-vs-local skew the audit flagged: store the user's tz or compute the day key consistently on the server and pass it from the client as a hint, validated).
- `/api/attempt` must **recompute** `correct` and `xpGained` from the stored `BankQuestion`/`Question` answer key — never trust the client values (closes the XP/mastery forgery hole).
- `/api/generate-plan`, `/api/areas`, `/api/taxonomy`, `/api/theory`, `/api/grade`: add `requireEntitlement` → reject unauthenticated/over-budget/over-limit with `429`/`403`; this closes the unauthenticated cost-amplification vector.

### 2.5 Anonymous → account progress claim

**Answer to "what happens to anonymous progress after login":** it is **claimed** into the new account, once, server-side, with caps.

- Client holds anonymous progress under `anonId` in localStorage (XP, streak, completed bank-question ids, current skill/drill, badges).
- On first successful register/login, the client `POST /api/claim { anonId, snapshot }`.
- `lib/claim.ts` merges into the user, **defensively**:
  - XP: `min(snapshot.xp, CLAIM_XP_CAP)` (e.g. cap at one level's worth, ~300 XP) to prevent fabricated-XP injection.
  - Streak: `max(account.streak, snapshot.streak)` but only if dates are plausible.
  - Completed questions: only **bank** question ids that actually exist and are `approved`; re-derive XP from their real `xp` values rather than trusting the snapshot total.
  - Skills: union, but respect the destination tier's skill cap (Basic keeps the **most recent** skill; surplus are remembered as "available to resume" if they later upgrade).
  - Badges: re-evaluate from the merged state via [lib/gamification.ts](../lib/gamification.ts) rather than trusting the snapshot list.
- After a successful claim, the client clears `anonId` state and switches to the DB-backed session bridge ([lib/session.tsx](../lib/session.tsx) `DbSessionBridge`).
- Idempotent: a `claimedAnonIds String[]` on `User` (or an `AuditEvent type="claim"`) prevents double-claiming.

---

## 3. The five junctions in detail

For each: **who**, **display**, **features/functionality**, **dashboard**, **AI usage & cost**, **security/controls**.

### Junction 1 — Anonymous (not logged in)
**Goal: get them excited enough to register.**

- **Display:** full landing (with **honest** stats — see §6), `/skills`, `/pricing`. Picking a skill goes **straight into a short 3-question onboarding** ([lib/survey](../lib/survey)) and then a real, playable drill — **no login wall**. Gamified UI (XP popups, level ring, streak) runs locally. A persistent but dismissible top strip: "Playing as guest — create a free account to save your streak."
- **Features:** 1 skill, up to **5 bank questions/day**, instant feedback, bank-cached theory ("Show the background"), XP/levels/streak/badges (local). MCQ/numeric/order/input/true-false types (everything except AI free-text grading). After 5 Q / first module / first badge → **"Save your progress" → `/login?claim=1`**.
- **Dashboard:** a **teaser** dashboard from local state only — shows the level ring, today's XP, and a blurred "Accuracy & mastery — create an account to unlock" panel. No server data.
- **AI usage & cost:** **none.** All content from `BankQuestion`; theory from `BankQuestion.theory*`. The client physically cannot reach `/api/generate-plan` (it isn't wired for anon). `GET /api/bank/drill` is **IP rate-limited** (e.g. 60 q/hour/IP) to stop scraping.
- **Security/controls:** no PII, no DB writes; ephemeral `anonId`; bank endpoint rate-limited and returns only `approved` content; no token, no budget, no live model. Abuse ceiling = bank reads.

### Junction 2 — Logged-in, email NOT confirmed
**Goal: confirm the email (behaves like a slightly-restricted anonymous Basic, with strong verify nudges).**

- **Display:** the full app **plus** a persistent `VerifyBanner` ([components/VerifyBanner.tsx](../components/VerifyBanner.tsx), translate it — it's hardcoded EN today) with a single primary action "Resend email." A post-login modal: "You're in! Confirm your email to unlock your first AI-personalized drill and progress tracking."
- **Features:** Basic features but **tighter**: **3 questions/day** (vs 5), **bank only** (no live AI at all), **cannot upgrade/pay** (checkout requires verified — see security). This is deliberate: it protects cost against throwaway/abuse signups *and* creates a concrete reason to verify. Progress **is** saved to the account (so it's not lost), and an anonymous claim (§2.5) runs here if `?claim=1`.
- **Dashboard:** Basic dashboard but with the tracking panel replaced by "Verify your email to turn on progress tracking" + the verify button.
- **AI usage & cost:** **$0** (bank only). `requireEntitlement(needVerified:true)` blocks all live AI routes for this state.
- **Security/controls:** **`emailVerified` becomes load-bearing** (today it's decorative): live AI, `/api/stripe/checkout`, and the skill-claim of >1 skill all require it. `verify/resend` is rate-limited (e.g. 3/hour) to stop mail-bombing via the real Resend key. Verification grants a one-time reward (bonus XP + the first live-personalized drill) to make the moment feel earned.

### Junction 3 — Basic (logged-in, verified, free)
**Goal: usable enough to love, restrictive enough to want Smart. "OK to use some AI tokens."**

- **Display:** full app, single-skill focus, upgrade CTAs at the friction points (daily-limit hit, locked second skill, blurred mastery panel). Locked Smart/Guru affordances are **shown, not hidden** ("Unlock 20/day and unlimited skills with Smart").
- **Features:**
  - **5 questions/day**, **1 skill**, server-enforced.
  - **One live-personalized drill per day** (the "wow"): the first new-subarea drill of the day is generated live with **Sonnet** (cheaper tier per [lib/aiModel.ts](../lib/aiModel.ts) `modelForTier("basic")`), the rest of the day is served from the bank. This is the "OK to use some AI" allowance and the single biggest taste of what Smart gives all the time.
  - Theory: bank-cached only (no live Haiku/Sonnet escalation).
  - No AI free-text grading (MCQ/numeric/order/input/true-false only).
- **Dashboard:** level, XP, **streak**, daily-goal ring, badges, single-skill progress, **plan usage** ("3 / 5 today"). The **accuracy / per-subarea mastery** panel is **teased** (blurred with a sample) and labelled "See your accuracy & weak areas with Smart." This is the core upgrade hook.
- **AI usage & cost:** budget **~$0.15/mo** ≈ 2–3 live Sonnet drills' worth; in practice the "1 live drill/day, Sonnet" rule plus `remainingBudget` keeps it well under. If the tiny budget is exhausted, the daily live drill silently becomes a bank drill.
- **Security/controls:** server enforces 5/day (from `Attempt`), 1 skill (count curricula), tier from DB, budget meter. `/api/attempt` recomputes XP/correctness from the answer key.

### Junction 4 — Smart ($10/mo, verified)
**Goal: deliver the "adaptive, personalized" promise; AI ≤ 20 % = $2/mo.**

- **Display:** full dashboard with tracking; skill switcher (unlimited skills); per-subarea mastery levels and drill-down ([app/dashboard/page.tsx](../app/dashboard/page.tsx) `SubareaLevels`).
- **Features:**
  - **20 questions/day**, **unlimited skills**.
  - **Live-personalized by default** (Opus), with adaptive continuation ("keep going" → avoid-mastered + revisit-missed, which already exists in [app/api/generate-plan/route.ts](../app/api/generate-plan/route.ts)).
  - **Real-time theory** (Haiku, escalating to Sonnet for hard items) — [lib/theory.ts](../lib/theory.ts).
  - **AI free-text grading** ([app/api/grade/route.ts](../app/api/grade/route.ts)).
  - Budget-governed: routing blends live + bank to stay within $2/mo. At 20/day, ~40 % of questions can be freshly generated within budget (~257 live Q/mo); the rest are bank, selected adaptively. Users perceive continuous personalization because the bank is concept-targeted to their weak areas.
- **Dashboard:** accuracy %, streak insights, per-subarea mastery + "% to next," weak-area recommendations, multi-skill overview, plan usage, billing management ([components/ManageBillingButton.tsx](../components/ManageBillingButton.tsx) — must be fixed, see §6).
- **AI usage & cost:** **$2.00/mo** ceiling via `AiUsage` ledger; **prompt caching** on the system block (already present at [lib/planGen.ts](../lib/planGen.ts):287) keeps input cost at ~0.1×. When budget is spent, bank fallback (still 20/day, still adaptive, just not freshly generated).
- **Security/controls:** server enforces 20/day + budget; Opus routing only while verified and in-budget; webhook-driven tier (hardened, see §5).

### Junction 5 — Guru ($40/mo, verified)
**Goal: "unlimited everything" + advanced insight; AI ≤ 20 % = $8/mo (mo) / $5.83 (yr).**

- **Display:** everything in Smart plus advanced analytics and priority-content badge.
- **Features:**
  - **Unlimited questions** (fair-use via budget), unlimited skills, **Opus everywhere**, highest theory escalation, AI grading.
  - **Exam/timed mode** and deeper question variety.
  - **Priority new content:** Guru accounts are first to receive newly-built bank skills/subareas and newly added custom-skill taxonomies.
  - Budget-governed at **$8/mo** ≈ ~1,000 live questions/mo; beyond that, seamless bank fallback so "unlimited" stays true without uncapped spend.
- **Dashboard:** advanced — predicted score / time-to-goal, weakness heatmap across subareas, full attempt history, exportable progress report (PDF). All derived from the existing `Attempt` audit log via [lib/serverState.ts](../lib/serverState.ts) / [lib/mastery.ts](../lib/mastery.ts).
- **AI usage & cost:** **$8.00/mo** (or $5.83 on annual) ceiling; same caching + ledger; bank fallback past budget.
- **Security/controls:** budget fair-use cap (prevents a single Guru user from costing $24/mo of Opus); everything else as Smart.

---

## 4. Dashboard by junction (what's visible, where the data comes from)

| Panel | Anon | Unverified | Basic | Smart | Guru |
|---|---|---|---|---|---|
| Level ring / XP / today's goal | local | server | server | server | server |
| Streak | local | server | server | server | server |
| Badges | local | server | server | server | server |
| Single-skill progress | local | server | server | server | server |
| Multi-skill overview | — | — | — (1 skill) | ✓ | ✓ |
| Accuracy % | teased | teased | **teased (upsell)** | ✓ | ✓ |
| Per-subarea mastery + % to next | — | — | teased | ✓ | ✓ |
| Weak-area recommendations | — | — | — | ✓ | ✓ |
| Predicted score / time-to-goal | — | — | — | — | ✓ |
| Weakness heatmap / history / export | — | — | — | — | ✓ |
| Plan usage ("N/limit today") | local | server | ✓ | ✓ | ✓ |
| Billing management | — | — | upgrade CTA | manage | manage |

"Teased" = rendered blurred with a representative sample and an upgrade CTA. This is the conversion engine; the data already exists server-side in the `Attempt` log.

---

## 5. Security & controls (consolidated)

These fold in the concrete vulnerabilities found in the audit; every protected route uses `requireEntitlement` (§2.4).

| Control | Where | Rule |
|---|---|---|
| **Server daily-limit** | `lib/entitlement.ts`, `/api/attempt`, `/api/generate-plan` | Count today's attempts server-side; reject over-limit with `429`. Day key consistent (fix UTC/local skew). |
| **Server skill-cap** | `/api/generate-plan` | Basic = 1 active curriculum; reject the 4th-skill build, don't just hide it client-side. |
| **No client-authored XP/correctness** | `/api/attempt` | Recompute `correct` + `xpGained` from the stored answer key; ignore client values. |
| **AI auth + budget** | all AI routes | `requireEntitlement(needVerified, kind)` + `remainingBudget` before any model call. Closes unauthenticated cost-amplification + per-tier bypass. |
| **Email verification load-bearing** | AI routes, `/api/stripe/checkout` | `emailVerified` required for live AI, paid checkout, and >1-skill claim. |
| **Rate limits** | register, login, forgot, verify/resend, bank/drill | Per-IP + per-account throttles (e.g. Upstash). Stops credential stuffing, mail-bombing, bank scraping. |
| **Stripe webhook hardening** | `/api/stripe/webhook` | **Hard-fail (400) when `STRIPE_WEBHOOK_SECRET` is missing**; never `JSON.parse` fallback. Verify signature always. |
| **Checkout not a dead end** | `/api/stripe/checkout`, `components/PlanCards.tsx` | If Stripe unconfigured, **hide** paid CTAs and show "Payments coming soon — join waitlist," not a red "Billing not configured" error. |
| **Promo code** | `/api/promo` | Move `VLADDYXOXO`→guru out of source to an env-configured, expiring, usage-capped, per-account code; or gate behind admin. It currently grants $40/mo Guru free to anyone who sees the string. |
| **Account enumeration** | `/api/register` | Return a uniform response; don't distinguish 409 "exists" from 200 "created" without rate-limiting + generic copy. |
| **Password reset → session revoke** | `auth.ts` | Bump a per-user token version on password change; reject older JWTs. |
| **PII retention** | `/api/contact`, `AuditEvent` | Retention policy + redaction on the append-only audit table. |
| **Anon claim caps** | `/api/claim` | XP cap, bank-only re-derivation, idempotent per `anonId`. |

---

## 6. Conversion-flow fixes (do these regardless — they block sign-ups today)

1. **Restore a real funnel:** remove the login wall before first value (§2.1). This is the single highest-leverage change for "more sign-ups."
2. **Fix or hide the paid buttons:** with Stripe keys blank, every "Upgrade" currently surfaces a red **"Billing not configured."** Either configure Stripe or hide paid CTAs behind a waitlist. A dead, error-flashing pay button is worse than no button.
3. **Replace fabricated stats** ("10,000+ learners," "70,000+ questions/day") on a prototype labelled "A design prototype" — legal/credibility risk. Use real counters (from the `Attempt`/`User` tables) or aspirational-but-honest copy.
4. **Fix dead links:** footer About/Blog/Careers → `#`.
5. **Decide the i18n claim:** the homepage advertises one-click EN⇄PL but `locale` is hardcoded `"en"` and there's no switcher. Either ship the switcher (the PL dictionary already exists) or drop the claim until it's real. The bank should be natively bilingual so PL isn't English-under-a-Polish-UI.

---

## 7. Data-model changes (summary)

Additive Prisma models (no breaking migrations):
- `BankQuestion` (§2.2) — the shared content bank (+ optional `BankBuildRun` for audit).
- `AiUsage` (§2.3) — append-only AI spend ledger.
- `User` additions: `claimedAnonIds String[] @default([])`, `pwTokenVersion Int @default(0)`, optional `timezone String?`.

Reuse existing: `SkillTaxonomy` (drives the bank build), `Curriculum`/`Question`/`Attempt` (live path + audit), `User.tier`/Stripe fields, `User.subareaLevels`.

---

## 8. API changes (route by route)

| Route | Change |
|---|---|
| `GET /api/bank/drill` | **New.** Anonymous-allowed, IP-rate-limited, serves N approved `BankQuestion`s for (skill, subarea, level), concept-deduped. **No live AI.** |
| `POST /api/claim` | **New.** Anonymous→account merge with caps (§2.5). |
| `POST /api/generate-plan` | Add `requireEntitlement(needVerified, kind:"plan")`; route Basic→Sonnet single daily drill, paid→Opus in-budget else bank; `recordUsage`. |
| `POST /api/theory` | Add entitlement+verify; paid→live (cached per question), others→`BankQuestion.theory`. `recordUsage`. |
| `POST /api/grade` | Add entitlement+verify; **paid only**; `recordUsage`. |
| `POST /api/attempt` | Server-recompute `correct`/`xpGained` from answer key; server daily-count; reject over-limit. |
| `POST /api/areas`, `/api/taxonomy` | Require auth (these are uncached AI cost amplifiers today); cache results; `recordUsage`. |
| `POST /api/stripe/checkout` | Require `emailVerified`; if Stripe unconfigured, return a structured "waitlist" state the UI renders as a friendly CTA (not an error). |
| `POST /api/stripe/webhook` | Hard-fail without `STRIPE_WEBHOOK_SECRET`; always verify signature. |
| `POST /api/promo` | Env-configured, expiring, capped codes; verify required. |
| `GET /api/state` | Unchanged shape; now also returns `remainingToday`, `tier`, `remainingBudgetPct` for honest UI meters. |

---

## 9. Cost model (worked, real pricing)

Per-operation (system prompt cached at ~0.1×):

| Operation | Model | ~Cost |
|---|---|---|
| Live drill (10 Q, structured) | Opus 4.8 | **$0.078** |
| Live drill (10 Q) | Sonnet 4.6 | **$0.047** |
| Theory / question | Haiku 4.5 | **$0.0028** |
| Free-text grade | Haiku 4.5 | **$0.0011** |
| Taxonomy (once/skill, shared, cached) | Opus 4.8 | ~$0.07 amortized to ~$0 |
| **Bank serve** | — | **$0** |

Offline bank build (batch −50 %): **~$0.0035/question** → **~$70 for 20k Q**, **~$350 for 100k Q**; theory ~$30 for 20k. One-time + monthly top-ups.

Monthly per-user budgets (= 20 % of revenue), and what they buy:

| Tier | Revenue/mo | AI budget/mo | ≈ live drills | ≈ live questions |
|---|---|---|---|---|
| Basic | $0 | $0.15 (promo) | ~2 (Sonnet) | ~30 |
| Smart (mo) | $10 | $2.00 | ~26 (Opus) | ~257 |
| Smart (yr) | $8.33 | $1.67 | ~21 | ~214 |
| Guru (mo) | $40 | $8.00 | ~103 | ~1,029 |
| Guru (yr) | $29.17 | $5.83 | ~75 | ~750 |

**Invariant:** the ledger refuses live generation past budget and falls back to the bank, so blended AI spend is **≤ 20 % of revenue by construction**, and **anonymous traffic is $0**. Levers if you want more freshness per dollar: raise the cache hit-rate (cache `(skill, subarea, level)` profiles), use Sonnet for Smart instead of Opus (−40 %), and pre-generate the most-requested subareas into the bank.

---

## 10. Phased build plan (for an executing agent)

Each phase is independently shippable and testable.

- **Phase 0 — unblock the funnel (no new infra).** Fix Stripe dead-end (hide/waitlist), real/honest stats, footer links, decide i18n claim. Hard-fail webhook without secret. *Accept:* no error-flashing pay buttons; webhook rejects unsigned events.
- **Phase 1 — server-side entitlement.** `lib/entitlement.ts`; enforce daily/skill caps + recompute XP/correctness in `/api/attempt`; add auth to AI routes. *Accept:* scripted `/api/attempt` flood is capped at the tier limit; a Basic token cannot build a 4th skill or forge XP; unauthenticated `/api/generate-plan` returns 401.
- **Phase 2 — Content Bank.** `BankQuestion` model + `scripts/build-bank.ts` (batch) with the answer-key self-check gate; `GET /api/bank/drill`. Seed all predefined skills. *Accept:* a drill renders entirely from the bank with $0 AiUsage; ≥99 % of approved items pass an independent answer-key check.
- **Phase 3 — anonymous mode + claim.** `useOptionalAuth`; anon plays from the bank; "save progress" interstitial; `/api/claim` with caps. *Accept:* a logged-out user answers 5 questions and registers; their XP/streak appear on the account exactly once, XP-capped.
- **Phase 4 — budget ledger + routing.** `AiUsage`, `lib/budget.ts`, wire `remainingBudget` into all AI routes; Basic 1-live-drill/day (Sonnet); Smart/Guru live-then-bank. *Accept:* a synthetic Smart user driven past $2 of live calls is transparently served from the bank; monthly rollup ≤ budget for every tier.
- **Phase 5 — verification gating + dashboards.** Make `emailVerified` load-bearing; build the teased/full/advanced dashboard tiers; verification reward. *Accept:* unverified user cannot trigger live AI or checkout; Basic sees the blurred mastery upsell; Smart/Guru see full analytics.
- **Phase 6 — security hardening.** Rate limits, promo-code rework, password-reset session revoke, PII retention, account-enumeration fix. *Accept:* automated checks for each control in §5.

---

## 11. Open decisions (need a product call)

1. **Basic's live allowance:** "1 live Sonnet drill/day" vs "first-ever drill only." (Recommend: 1/day — recurring taste of personalization is a stronger upgrade driver.)
2. **Guru fair-use number:** the $8/mo cap implies ~1,000 live Q/mo; confirm that's "unlimited enough," or raise the budget and accept >20 % for the top tier as a premium-experience cost.
3. **Bank size & refresh cadence:** start at ~20k Q (~$70) or go straight to ~100k (~$350)? Monthly rebuild vs quarterly?
4. **i18n:** ship the PL switcher now (bank built bilingually) or remove the claim until later?
5. **Custom ("Other") skills:** anonymous/Basic on a brand-new custom skill have no bank. Options: (a) custom skills are a paid-only feature, (b) generate-on-first-use is charged to the creator's budget and the result seeds the bank for everyone. (Recommend: (b) for paid, block for anon/Basic — preserves $0 anon.)

---

*Everything above is additive to the current code and maps to existing seams (`lib/aiModel.ts`, `lib/plans.ts`, `lib/planGen.ts`, `lib/taxonomy.ts`, `lib/serverState.ts`, `app/api/*`). No live AI is required for anonymous traffic; paid AI is capped at 20 % of revenue by the ledger.*
