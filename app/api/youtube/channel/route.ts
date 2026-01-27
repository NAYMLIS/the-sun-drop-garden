import { NextResponse } from "next/server";
import type { YouTubeChannel } from "@/lib/types";

async function getChannelIdByHandle(apiKey: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=TheSundropGarden&key=${apiKey}`,
      {
        next: { revalidate: 86_400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) {
      throw new Error("Failed to search for channel");
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      // Find the channel that matches the handle
      const channel = data.items.find(
        (item: { snippet: { customUrl: string } }) =>
          item.snippet.customUrl === "@TheSundropGarden"
      );

      if (channel) {
        return channel.id.channelId;
      }

      // Fallback to first result if exact match not found
      return data.items[0].id.channelId;
    }

    return null;
  } catch (error) {
    console.error("Error resolving channel handle:", error);
    return null;
  }
}

export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "YouTube API key not configured" },
      { status: 500 }
    );
  }

  try {
    // First, resolve the handle to channel ID
    const channelId = await getChannelIdByHandle(apiKey);

    if (!channelId) {
      throw new Error("Channel not found");
    }

    // Then fetch channel details
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`,
      {
        next: { revalidate: 86_400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch channel data");
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error("Channel data not found");
    }

    const channelData = data.items[0];

    const channel: YouTubeChannel = {
      id: channelData.id,
      title: channelData.snippet.title,
      description: channelData.snippet.description || "",
      subscriberCount: Number.parseInt(
        channelData.statistics.subscriberCount || "0",
        10
      ),
      thumbnail:
        channelData.snippet.thumbnails.high?.url ||
        channelData.snippet.thumbnails.default?.url ||
        "",
      customUrl: channelData.snippet.customUrl || "",
    };

    return NextResponse.json(channel);
  } catch (error) {
    console.error("YouTube channel error:", error);
    return NextResponse.json(
      { error: "Failed to fetch channel data" },
      { status: 500 }
    );
  }
}
