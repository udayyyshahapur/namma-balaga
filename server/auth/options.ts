  import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@server/db/client";
import { user } from "@server/db/schema";
import { eq } from "drizzle-orm";

async function getUserByEmail(email: string) {
  const rows = await db.select().from(user).where(eq(user.email, email)).limit(1);
  return rows[0] ?? null;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const u = await getUserByEmail(creds.email);
        if (!u) return null;
        const ok = await bcrypt.compare(creds.password, u.passwordHash);
        return ok ? { id: String(u.id), email: u.email, name: u.name ?? undefined } : null;
      },
    }),
  ],
  pages: { signIn: "/auth/sign-in" },
  callbacks: {
    async jwt({ token, user }) { if (user?.id) token.sub = user.id; return token; },
    async session({ session, token }) { if (session.user && token.sub) (session.user as any).id = token.sub; return session; },
  },
};
