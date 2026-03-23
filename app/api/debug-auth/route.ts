import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const session = await getServerSession(authOptions);

  const cookies = request.cookies.getAll().map((c) => ({
    name: c.name,
    valueLength: c.value.length,
  }));

  return NextResponse.json({
    hasToken: !!token,
    tokenEmail: token?.email ?? null,
    hasSession: !!session,
    sessionEmail: session?.user?.email ?? null,
    cookies,
    env: {
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      secretLength: process.env.NEXTAUTH_SECRET?.length ?? 0,
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      nextauthUrl: process.env.NEXTAUTH_URL ?? "NOT SET",
      vercelUrl: process.env.VERCEL_URL ?? "NOT SET",
    },
  });
}
