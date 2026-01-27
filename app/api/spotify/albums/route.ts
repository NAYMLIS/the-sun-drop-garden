import { NextResponse } from "next/server";
import { getSpotifyAlbums } from "@/lib/spotify";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artistId = searchParams.get("id") || undefined;

  const albums = await getSpotifyAlbums(artistId);

  return NextResponse.json(albums);
}
