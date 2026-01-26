import { NextResponse } from "next/server";
import type { SpotifyAlbum } from "@/lib/types";
import { spotifyUriToUrl } from "@/lib/utils";

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
  const artistId = searchParams.get("id") || "7ky8m0sLXzkLqR7wsjfC6P"; // Default: ((( O )))

  try {
    const token = await getAccessToken();

    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album&market=US&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 86_400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch albums");
    }

    const data = await response.json();

    const albums: SpotifyAlbum[] = data.items.map(
      (album: {
        id: string;
        name: string;
        images: Array<{ url: string }>;
        release_date: string;
        uri: string;
      }) => ({
        id: album.id,
        name: album.name,
        image: album.images[0]?.url || "",
        releaseDate: album.release_date.substring(0, 4), // Just the year
        uri: album.uri,
        spotifyUrl: spotifyUriToUrl(album.uri),
      })
    );

    return NextResponse.json(albums);
  } catch (error) {
    console.error("Spotify albums error:", error);
    return NextResponse.json(
      { error: "Failed to fetch albums" },
      { status: 500 }
    );
  }
}
