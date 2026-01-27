import { NextResponse } from "next/server";
import { getSpotifyArtist } from "@/lib/spotify";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artistId = searchParams.get("id") || undefined;

  const artist = await getSpotifyArtist(artistId);

  if (!artist) {
    return NextResponse.json(
      { error: "Failed to fetch artist data" },
      { status: 500 }
    );
  }

  return NextResponse.json(artist);
}
