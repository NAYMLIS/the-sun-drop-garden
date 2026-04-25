import { NextResponse } from "next/server";

// Debug endpoint — exposes only the Convex URL host and counts so we can
// confirm SSR is talking to the right deployment. No secret values leak.
export const dynamic = "force-dynamic";

const PROTOCOL_PREFIX = /^https?:\/\//;
const TRAILING_SLASH = /\/$/;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || "(unset)";
  const host = url.replace(PROTOCOL_PREFIX, "").replace(TRAILING_SLASH, "");

  // Try fetching counts directly from Convex
  let tourDateCount: number | string = "n/a";
  let attractionCount: number | string = "n/a";
  let attractionSample: string[] = [];

  try {
    const r1 = await fetch(`${url}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "tourDates:list",
        args: {},
        format: "json",
      }),
      cache: "no-store",
    });
    const j1 = (await r1.json()) as { value?: unknown[] };
    tourDateCount = Array.isArray(j1.value) ? j1.value.length : "not-array";
  } catch (e) {
    tourDateCount = `error: ${(e as Error).message}`;
  }

  try {
    const r2 = await fetch(`${url}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "attractions:list",
        args: {},
        format: "json",
      }),
      cache: "no-store",
    });
    const j2 = (await r2.json()) as { value?: { name?: string }[] };
    attractionCount = Array.isArray(j2.value) ? j2.value.length : "not-array";
    if (Array.isArray(j2.value)) {
      attractionSample = j2.value.slice(0, 5).map((a) => a.name || "(no name)");
    }
  } catch (e) {
    attractionCount = `error: ${(e as Error).message}`;
  }

  return NextResponse.json({
    convexHost: host,
    tourDateCount,
    attractionCount,
    attractionSample,
  });
}
