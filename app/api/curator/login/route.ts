import { ConvexHttpClient } from "convex/browser";
import { type NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL not set");
}
const client = new ConvexHttpClient(CONVEX_URL);

const SESSION_COOKIE = "curator_session";
const SESSION_MAX_AGE_S = 30 * 24 * 60 * 60; // 30 days
const CONVEX_PREFIX_RE = /^\[.*?\]\s*/;
const CALLED_BY_CLIENT_RE = /\s*Called by client$/i;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!(email && password)) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }
    const result = await client.mutation(api.curators.login, {
      email,
      password,
    });
    const res = NextResponse.json({
      ok: true,
      email: result.email,
      displayName: result.displayName,
    });
    res.cookies.set(SESSION_COOKIE, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_S,
    });
    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Login failed";
    // Strip Convex's [Server Error] / [CONVEX...] prefixes
    const clean = msg
      .replace(CONVEX_PREFIX_RE, "")
      .replace(CALLED_BY_CLIENT_RE, "")
      .trim();
    return NextResponse.json(
      { error: clean || "Invalid email or password." },
      { status: 401 }
    );
  }
}
