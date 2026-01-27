"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/navigation";
import type { YouTubeChannel, YouTubeVideo } from "@/lib/types";

export default function LightPage() {
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadYouTubeData = async () => {
      setIsLoading(true);
      try {
        const [channelResponse, videosResponse] = await Promise.all([
          fetch("/api/youtube/channel"),
          fetch("/api/youtube/videos"),
        ]);

        // Handle channel data
        if (channelResponse.ok) {
          const channelData = await channelResponse.json();
          if ("error" in channelData) {
            // Silently handle error - YouTube API may not be configured
          } else {
            setChannel(channelData);
          }
        }
        // Silently handle non-ok responses - YouTube API may not be configured

        // Handle videos data
        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          if (!("error" in videosData) && Array.isArray(videosData)) {
            setVideos(videosData);
          }
          // Silently handle error - YouTube API may not be configured
        }
        // Silently handle non-ok responses - YouTube API may not be configured
      } catch (_error) {
        // Silently handle network errors - YouTube API may not be configured
      } finally {
        setIsLoading(false);
      }
    };
    loadYouTubeData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatViewCount = (count: number) => {
    if (count >= 1_000_000) {
      return `${(count / 1_000_000).toFixed(1)}M views`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="mx-auto max-w-7xl animate-fade-in px-6 pt-32 pb-12 md:px-12">
        {isLoading ? (
          <div className="flex h-[50vh] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Channel Header */}
            {channel && (
              <div className="mb-16 flex flex-col items-center gap-6 md:flex-row md:items-start">
                {channel.thumbnail && (
                  <div className="relative flex-shrink-0">
                    <Image
                      alt={channel.title}
                      className="h-32 w-32 rounded-full object-cover"
                      height={128}
                      src={channel.thumbnail}
                      width={128}
                    />
                  </div>
                )}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="mb-2 font-serif text-4xl text-foreground md:text-5xl">
                    {channel.title}
                  </h2>
                  {channel.subscriberCount > 0 && (
                    <p className="mb-4 text-primary text-sm uppercase tracking-widest">
                      {channel.subscriberCount.toLocaleString()} subscribers
                    </p>
                  )}
                  {channel.description && (
                    <p className="max-w-2xl text-foreground/70 text-sm leading-relaxed">
                      {channel.description.length > 200
                        ? `${channel.description.substring(0, 200)}...`
                        : channel.description}
                    </p>
                  )}
                  {channel.customUrl && (
                    <a
                      className="mt-4 inline-block text-primary text-sm underline transition-colors hover:text-primary/80"
                      href={`https://www.youtube.com${channel.customUrl}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Visit Channel →
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Videos Grid */}
            {videos.length > 0 && (
              <>
                <h3 className="mb-6 border-foreground/10 border-b pb-2 text-foreground/50 text-xl uppercase tracking-widest">
                  Latest Videos
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {videos.map((video) => (
                    <a
                      className="group cursor-pointer"
                      href={video.url}
                      key={video.id}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <div className="relative mb-4 aspect-video overflow-hidden rounded-lg bg-foreground/5">
                        {video.thumbnail && (
                          <Image
                            alt={video.title}
                            className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-100"
                            height={360}
                            src={video.thumbnail}
                            width={640}
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <Play
                            className="fill-current text-foreground"
                            size={48}
                          />
                        </div>
                      </div>
                      <h4 className="mb-2 line-clamp-2 font-serif text-foreground text-lg">
                        {video.title}
                      </h4>
                      <div className="flex items-center gap-2 text-foreground/40 text-xs uppercase tracking-wider">
                        <span>{formatDate(video.publishedAt)}</span>
                        <span>•</span>
                        <span>{formatViewCount(video.viewCount)}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}

            {/* Empty State */}
            {!channel && videos.length === 0 && !isLoading && (
              <div className="flex h-[50vh] flex-col items-center justify-center text-center">
                <p className="mb-4 text-foreground/60 text-lg">
                  YouTube channel data unavailable
                </p>
                <p className="text-foreground/40 text-sm">
                  Please configure YOUTUBE_API_KEY to display channel content
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
