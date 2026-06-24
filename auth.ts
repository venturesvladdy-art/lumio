import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { tierForEmail } from "@/lib/allowlist";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Adapter persists users/accounts; absent in demo mode (no DB) so it still builds.
  adapter: prisma ? PrismaAdapter(prisma) : undefined,
  session: { strategy: "jwt" }, // required for the Credentials provider
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    // Reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET from the environment.
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        if (!prisma) return null;
        const email = String(creds?.email ?? "")
          .toLowerCase()
          .trim();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tier: user.tier,
        } as { id: string; email: string | null; name: string | null; tier: string };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as Record<string, unknown>).uid = (user as { id?: string }).id;
        (token as Record<string, unknown>).tier =
          (user as { tier?: string }).tier ?? "basic";
      }
      // Keep tier fresh so Stripe webhook changes take effect without re-login.
      const uid = (token as Record<string, unknown>).uid as string | undefined;
      if (uid && prisma) {
        const u = await prisma.user.findUnique({
          where: { id: uid },
          select: { tier: true },
        });
        if (u) (token as Record<string, unknown>).tier = u.tier;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as Record<string, unknown>;
      if (session.user) {
        const u = session.user as unknown as Record<string, unknown>;
        u.id = t.uid;
        u.tier = t.tier ?? "basic";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Apply the Guru allowlist when an account is first created (e.g. Google).
      if (!prisma || !user.email || !user.id) return;
      const forced = tierForEmail(user.email);
      if (forced) {
        await prisma.user.update({ where: { id: user.id }, data: { tier: forced } });
      }
    },
  },
});
