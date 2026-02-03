import { fetchQuery } from "convex/nextjs";
import { Navigation } from "@/components/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ThreadContent } from "./thread-content";

interface Post {
  _id: Id<"posts">;
  _creationTime: number;
  caption?: string;
  mediaType: "image" | "audio" | "video" | "link" | null;
  fileId?: Id<"_storage">;
  fileUrl?: string;
  linkUrl?: string;
  linkType?: "youtube" | "soundcloud" | "bandcamp" | "vimeo" | "generic";
  linkTitle?: string;
  linkDescription?: string;
  linkImage?: string;
  linkFavicon?: string;
  createdAt: number;
}

export default async function ThreadPage() {
  let posts: Post[] = [];
  try {
    const fetchedPosts = await fetchQuery(api.posts.list);
    posts = (fetchedPosts || []) as Post[];
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    // Continue with empty array if query fails
    posts = [];
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="mx-auto flex min-h-[calc(100vh-2rem)] w-full animate-fade-in flex-col px-6 pt-32 md:px-12">
        <h2 className="mb-8 whitespace-nowrap border-primary/20 border-b font-serif text-2xl text-foreground">
          Thread
        </h2>
        <ThreadContent posts={posts} />
      </main>
    </div>
  );
}
