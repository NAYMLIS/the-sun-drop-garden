import { NextResponse } from "next/server";
import type { SpotifyArtist } from "@/lib/types";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!(clientId && clientSecret)) {
    throw new Error(
      "Spotify credentials not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables."
    );
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to get Spotify token");
  }

  const data = await response.json();
  return data.access_token;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artistId = searchParams.get("id") || "5rBFU1rhgs1nNghopuj9k8"; // Default: ((( 0 )))

  try {
    const token = await getAccessToken();

    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 86_400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch artist data");
    }

    const data = await response.json();

    const artist: SpotifyArtist = {
      id: data.id,
      name: data.name,
      followers: data.followers.total,
      image: data.images[0]?.url || "",
      genres: data.genres,
    };

    return NextResponse.json(artist);
  } catch (error) {
    console.error("Spotify artist error:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist data" },
      { status: 500 }
    );
  }
}
