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
  // Failed logins are expected; don't dump stack traces in the console.
  logger: {
    error(error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "type" in error &&
        (error as { type?: string }).type === "CredentialsSignin"
      ) {
        return;
      }
      console.error("[auth]", error);
    },
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
    async jwt({ token, user }) {
      if (user && "login" in user && typeof user.login === "string") {
        token.sub = user.id;
        token.login = user.login;
        return token;
      }

      // Legacy JWT (pre-login field) or wiped user: repair once, or drop session.
      if (token.sub && typeof token.login !== "string") {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { login: true },
          });
          if (!dbUser) {
            return {};
          }
          token.login = dbUser.login;
        } catch {
          return {};
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.sub === "string" ? token.sub : "";
        session.user.login =
          typeof token.login === "string" ? token.login : "";
      }
      return session;
    },
  },
});
