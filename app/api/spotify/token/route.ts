import { NextResponse } from "next/server";

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!(clientId && clientSecret)) {
    return NextResponse.json(
      { error: "Spotify credentials not configured" },
      { status: 500 }
    );
  }

  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return NextResponse.json({ access_token: cachedToken.token });
  }

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error("Failed to get Spotify token");
    }

    const data = await response.json();

    // Cache token (expires in 1 hour, cache for 55 minutes)
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + 55 * 60 * 1000,
    };

    return NextResponse.json({ access_token: data.access_token });
  } catch (error) {
    console.error("Spotify token error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate with Spotify" },
      { status: 500 }
    );
  }
}
