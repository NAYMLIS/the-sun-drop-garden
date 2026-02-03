"use client";

import { useQuery } from "convex/react";
import { PostMedia } from "@/components/media-embed";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface Post {
  _id: Id<"posts">;
  _creationTime: number;
  caption?: string;
  mediaType: "image" | "audio" | "video" | "link" | null;
  fileId?: Id<"_storage">;
  fileUrl?: string;
  linkUrl?: string;
  linkType?:
    | "youtube"
    | "soundcloud"
    | "bandcamp"
    | "vimeo"
    | "spotify"
    | "generic";
  linkTitle?: string;
  linkDescription?: string;
  linkImage?: string;
  linkFavicon?: string;
  createdAt: number;
}

interface ThreadContentProps {
  posts: Post[];
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ThreadContent({ posts: initialPosts }: ThreadContentProps) {
  // Use real-time query for live updates
  const queryResult = useQuery(api.posts.list);
  // Handle query errors gracefully - use initialPosts if query fails
  let posts: Post[] = [];
  if (Array.isArray(queryResult)) {
    posts = queryResult;
  } else if (Array.isArray(initialPosts)) {
    posts = initialPosts;
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-center text-foreground/40 text-lg italic">
          No posts yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {posts.map((post) => (
        <article
          className="rounded-lg border border-primary/10 bg-foreground/5 p-6"
          key={post._id}
        >
          {post.caption && (
            <div className="mb-4">
              <p className="text-base text-foreground leading-relaxed">
                {post.caption}
              </p>
            </div>
          )}

          {(post.mediaType || post.fileId) && (
            <div className="mb-4">
              <PostMedia
                fileId={post.fileId}
                fileUrl={post.fileUrl}
                linkDescription={post.linkDescription}
                linkFavicon={post.linkFavicon}
                linkImage={post.linkImage}
                linkTitle={post.linkTitle}
                linkType={post.linkType}
                linkUrl={post.linkUrl}
                mediaType={post.mediaType}
              />
            </div>
          )}

          <div className="text-foreground/50 text-xs">
            {formatDate(post.createdAt)}
          </div>
        </article>
      ))}
    </div>
  );
}
