import { fetchQuery } from "convex/nextjs";
import { Navigation } from "@/components/navigation";
import { api } from "@/convex/_generated/api";
import { ThreadContent } from "./thread-content";

export default async function ThreadPage() {
  const posts = await fetchQuery(api.posts.list);

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
