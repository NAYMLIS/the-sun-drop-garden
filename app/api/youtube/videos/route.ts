import { NextResponse } from "next/server";
import { getYouTubeVideos } from "@/lib/youtube";

export async function GET() {
  const videos = await getYouTubeVideos();

  return NextResponse.json(videos);
}
