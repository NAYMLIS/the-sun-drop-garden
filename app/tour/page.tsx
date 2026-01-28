import { fetchQuery } from "convex/nextjs";
import { Navigation } from "@/components/navigation";
import { api } from "@/convex/_generated/api";
import type { Attraction, AttractionCategory } from "@/lib/types";
import { TourContent } from "./tour-content";

export default async function TourPage() {
  const [dates, rawAttractions] = await Promise.all([
    fetchQuery(api.tourDates.list),
    fetchQuery(api.attractions.list),
  ]);

  const attractions: Attraction[] = rawAttractions.map(
    (attr: Omit<Attraction, "category"> & { category: string }) => ({
      ...attr,
      category: attr.category as AttractionCategory,
    })
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="mx-auto flex min-h-[calc(100vh-2rem)] w-full animate-fade-in flex-col px-6 pt-32 md:px-12">
        <h2 className="mb-8 whitespace-nowrap border-primary/20 border-b font-serif text-2xl text-foreground">
          2026 North American Tour
        </h2>
        <TourContent attractions={attractions} dates={dates} />
      </main>
    </div>
  );
}
