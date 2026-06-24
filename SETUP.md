# Lumio — Real Backend Setup

Lumio runs in two modes:

- **Demo mode (default):** zero setup. Auth, progress and plan are simulated in
  the browser (`localStorage`). Great for clicking through the product.
- **Real mode:** Auth.js sign-in (email/password + Google), Neon Postgres with a
  full **audit log** (every curriculum, Q&A, and answer stored per user/skill),
  and Stripe subscriptions.

You flip between them with **one flag**: `NEXT_PUBLIC_USE_DB`.

> Nothing below is required to keep demoing. Do it when you're ready to go live.
> The code is written and builds; these steps connect the external accounts.

---

## 0. Prerequisites

Create free accounts: [Neon](https://neon.tech) (database),
[Google Cloud](https://console.cloud.google.com) (Google sign-in),
[Stripe](https://dashboard.stripe.com) (payments). Optionally the
[Stripe CLI](https://stripe.com/docs/stripe-cli) for local webhook testing.

```bash
cp .env.local.example .env.local   # you'll fill this in as you go
```

---

## 1. Database (Neon) + audit tables

1. Create a Neon project. From the dashboard copy **two** connection strings:
   - the **pooled** string → `DATABASE_URL`
   - the **direct** string → `DIRECT_URL`  (Neon shows both; direct is for migrations)
2. Paste both into `.env.local`.
3. Create the tables:

```bash
npx prisma migrate dev --name init   # or: npm run db:migrate
```

That creates the Auth.js tables plus the domain/audit tables:
`Curriculum`, `Question`, `Attempt`, `AuditEvent` (see `prisma/schema.prisma`).

Inspect your data anytime with:

```bash
npm run db:studio   # opens Prisma Studio
```

**What gets stored, per user, per skill:**
- `Curriculum` — one immutable row per generated plan (level, focus, summary, source, model).
- `Question` — every generated Q&A item (bilingual), linked to its curriculum.
- `Attempt` — append-only log of every answer (selected option, correct?, XP).
- `AuditEvent` — signups, plan generations, subscription changes.

---

## 2. Auth.js (sign-in)

1. **Secret:**
   ```bash
   npx auth secret    # writes AUTH_SECRET to .env.local (or: openssl rand -base64 32)
   ```
2. **Google OAuth:** Google Cloud → *APIs & Services → Credentials → Create
   credentials → OAuth client ID → Web application*.
   - Authorized JavaScript origin: `http://localhost:3000`
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy the client id/secret → `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.
   - (Add your production origin + `/api/auth/callback/google` later.)

Email + password works with no extra service (passwords are bcrypt-hashed in the
DB). The Guru allowlist in `lib/allowlist.ts` still applies — sign in as
`vladimir.s.anokhin@gmail.com` and you're auto-granted Guru.

---

## 3. Stripe (subscriptions)

1. **Products & prices** — Dashboard → *Products*. Create two products with two
   prices each, then copy each price's **API ID** (`price_…`) into `.env.local`:

   | Product | Monthly | Yearly |
   |---|---|---|
   | Smart | $10 → `STRIPE_PRICE_SMART_MONTH` | $100 → `STRIPE_PRICE_SMART_YEAR` |
   | Guru  | $40 → `STRIPE_PRICE_GURU_MONTH`  | $350 → `STRIPE_PRICE_GURU_YEAR` |

2. **Secret key** → `STRIPE_SECRET_KEY` (Dashboard → Developers → API keys).
3. **Webhook (local):**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copy the printed `whsec_…` → `STRIPE_WEBHOOK_SECRET`. The webhook syncs the
   subscription to the user's plan (`User.tier`) automatically.
   In production, add a webhook endpoint at `https://your-domain/api/stripe/webhook`
   and use its signing secret.

Checkout and the "Manage billing" button (Customer Portal) are already wired to
these routes: `app/api/stripe/{checkout,portal,webhook}`.

---

## 4. Turn it on

In `.env.local`:

```bash
NEXT_PUBLIC_USE_DB=true
```

```bash
npm run dev   # restart so env vars load
```

Sign-in now uses real accounts, plans/Q&A/answers are written to Neon, and the
pricing page sends you to Stripe Checkout.

---

## 5. Deploy (Vercel)

1. Import the repo into Vercel.
2. Add every variable from `.env.local` to the project's Environment Variables
   (including `NEXT_PUBLIC_USE_DB=true`). Set `AUTH_URL` to your domain.
3. Build runs `prisma generate && next build` automatically. Apply migrations to
   the production DB once: `npx prisma migrate deploy`.
4. Add the production Google redirect URI and the production Stripe webhook
   endpoint; update the secrets in Vercel.

---

## Notes

- **Scale:** `User.tier` is read on each request via the JWT callback; for very
  high traffic, cache it. Cache plan generation by `(skill, level, focus)` to
  reuse curricula across similar learners.
- **Live progress** (XP/streak/daily) still lives in `localStorage` for snappy
  UX; the DB is the durable audit/record layer. Reconciling live progress into
  the DB is a natural next step.
- **Apple sign-in** was intentionally skipped (needs a $99/yr Apple Developer
  account). Add it later as another Auth.js provider.
