import { NextResponse } from "next/server";
import type { YouTubeVideo } from "@/lib/types";

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

    // Get latest videos
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=15&key=${apiKey}`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!searchResponse.ok) {
      throw new Error("Failed to fetch videos");
    }

    const searchData = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json([]);
    }

    // Extract video IDs
    const videoIds = searchData.items
      .map((item: { id: { videoId: string } }) => item.id.videoId)
      .join(",");

    // Get video details with statistics
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${apiKey}`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!videosResponse.ok) {
      throw new Error("Failed to fetch video details");
    }

    const videosData = await videosResponse.json();

    const videos: YouTubeVideo[] = videosData.items.map(
      (video: {
        id: string;
        snippet: {
          title: string;
          description: string;
          publishedAt: string;
          thumbnails: {
            high?: { url: string };
            medium?: { url: string };
            default?: { url: string };
          };
        };
        statistics: { viewCount: string };
      }) => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description || "",
        thumbnail:
          video.snippet.thumbnails.high?.url ||
          video.snippet.thumbnails.medium?.url ||
          video.snippet.thumbnails.default?.url ||
          "",
        publishedAt: video.snippet.publishedAt,
        viewCount: Number.parseInt(video.statistics.viewCount || "0", 10),
        url: `https://www.youtube.com/watch?v=${video.id}`,
      })
    );

    return NextResponse.json(videos);
  } catch (error) {
    console.error("YouTube videos error:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
