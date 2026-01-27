import { NextResponse } from "next/server";
import { getYouTubeChannel } from "@/lib/youtube";

export async function GET() {
  const channel = await getYouTubeChannel();

  if (!channel) {
    return NextResponse.json(
      { error: "Failed to fetch channel data" },
      { status: 500 }
    );
  }

  return NextResponse.json(channel);
}
