import type { YouTubeChannel, YouTubeVideo } from "@/lib/types";

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

export async function getYouTubeChannel(): Promise<YouTubeChannel | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const channelId = await getChannelIdByHandle(apiKey);

    if (!channelId) {
      throw new Error("Channel not found");
    }

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

    return {
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
  } catch (error) {
    console.error("YouTube channel error:", error);
    return null;
  }
}

export async function getYouTubeVideos(): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return [];
  }

  try {
    const channelId = await getChannelIdByHandle(apiKey);

    if (!channelId) {
      throw new Error("Channel not found");
    }

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
      return [];
    }

    const videoIds = searchData.items
      .map((item: { id: { videoId: string } }) => item.id.videoId)
      .join(",");

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

    return videosData.items.map(
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
  } catch (error) {
    console.error("YouTube videos error:", error);
    return [];
  }
}
