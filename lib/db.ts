import { PrismaClient } from "@prisma/client";

/**
 * Guarded Prisma singleton. `prisma` is null when DATABASE_URL is not set, so
 * the app still builds and runs in demo mode without a database. Callers must
 * null-check (or use `requirePrisma()`).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const hasDatabase = Boolean(process.env.DATABASE_URL);

export const prisma: PrismaClient | null = hasDatabase
  ? globalForPrisma.prisma ?? new PrismaClient()
  : null;

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}

export function requirePrisma(): PrismaClient {
  if (!prisma) {
    throw new Error(
      "Database not configured: set DATABASE_URL in .env.local (see SETUP.md)."
    );
  }
  return prisma;
}
