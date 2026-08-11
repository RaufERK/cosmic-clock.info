import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { normalizeLogin, touchLastSeen } from "@/lib/user-activity";

const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60; // ~30 days

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SEC,
  },
  providers: [
    Credentials({
      credentials: {
        login: { label: "Login", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const loginRaw = credentials?.login;
        const password = credentials?.password;
        if (typeof loginRaw !== "string" || typeof password !== "string") {
          return null;
        }

        const login = normalizeLogin(loginRaw);
        if (!login || !password) return null;

        const user = await prisma.user.findUnique({ where: { login } });
        if (!user) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        await touchLastSeen(user.id);

        return { id: user.id, login: user.login };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        if ("login" in user && typeof user.login === "string") {
          token.login = user.login;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        if (typeof token.login === "string") {
          session.user.login = token.login;
        }
      }
      return session;
    },
  },
});
