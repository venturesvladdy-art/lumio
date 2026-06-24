/**
 * When true, the app uses the real backend (Auth.js + Neon + Stripe).
 * When false (default), it runs the zero-setup demo (localStorage auth/state).
 * Set NEXT_PUBLIC_USE_DB=true alongside DATABASE_URL + auth/Stripe keys.
 */
export const USE_DB = process.env.NEXT_PUBLIC_USE_DB === "true";
