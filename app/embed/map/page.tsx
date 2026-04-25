import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Attraction, AttractionCategory } from "@/lib/types";
import { EmbedMapContent } from "./embed-map-content";

// Always render fresh so the regenerative spots stay in sync with Convex.
export const revalidate = 0;

export const metadata = {
  title: "The Sundrop Garden - Tour Map",
  description:
    "Interactive tour map for The Sundrop Garden 2026 North American Tour.",
};

export default async function EmbedMapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const cityParam = typeof params.city === "string" ? params.city : undefined;

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
    <EmbedMapContent
      attractions={attractions}
      dates={dates}
      initialCity={cityParam}
    />
  );
}
