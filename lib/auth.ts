import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const ALLOWED_EMAILS = [
  "enrique@marimbashome.com",
  "zayde@marimbashome.com",
];

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  debug: true,
  callbacks: {
    async signIn({ user, account }) {
      console.log("[AUTH] signIn callback:", {
        email: user.email,
        provider: account?.provider,
        allowed: ALLOWED_EMAILS.includes(user.email?.toLowerCase() ?? ""),
      });
      return ALLOWED_EMAILS.includes(user.email?.toLowerCase() ?? "");
    },
    async jwt({ token, user, account }) {
      console.log("[AUTH] jwt callback:", {
        hasToken: !!token,
        hasUser: !!user,
        email: token?.email || user?.email,
      });
      return token;
    },
    async session({ session, token }) {
      console.log("[AUTH] session callback:", {
        email: session?.user?.email,
        hasToken: !!token,
      });
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
