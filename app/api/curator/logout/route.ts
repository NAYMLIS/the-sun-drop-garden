import { ConvexHttpClient } from "convex/browser";
import { type NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";

const SESSION_COOKIE = "curator_session";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (url) {
      try {
        const client = new ConvexHttpClient(url);
        await client.mutation(api.curators.logout, { token });
      } catch {
        // ignore
      }
    }
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
