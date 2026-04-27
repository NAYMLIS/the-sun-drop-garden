/**
 * One-time migration: assign each existing attraction to one of ((( O )))'s 7 layers
 * + tag it with relevant sub-types based on name + category + description.
 *
 * Run with:
 *   bunx convex run scripts/classify-existing-attractions.ts
 *
 * (Actually: this file is a Node script that calls Convex from the client side.)
 *   bun run scripts/classify-existing-attractions.ts
 */
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

type Layer =
  | "food"
  | "groceries"
  | "regeneration"
  | "wellness"
  | "stay"
  | "awareness"
  | "booking";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
if (!CONVEX_URL) {
  console.error("Set NEXT_PUBLIC_CONVEX_URL or CONVEX_URL");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

interface Classification {
  layer: Layer;
  tags: string[];
}

/**
 * Heuristic classifier — maps a spot to one of 7 layers + sub-tags.
 * Precedence is intentional (booking > stay > food > groceries > wellness > regeneration > awareness).
 */
function classify(name: string, category: string, description?: string): Classification {
  const blob = `${name} ${category} ${description ?? ""}`.toLowerCase();
  const has = (...kw: string[]) => kw.some((k) => blob.includes(k));

  // BOOKING (existing tour-venue category)
  if (category === "venues" || has("venue", "concert hall", "theater", "stage")) {
    return { layer: "booking", tags: ["venue"] };
  }

  // STAY (lodging)
  if (
    category === "accommodation" ||
    has("hotel", "inn", "lodge", "bnb", "b&b", "guesthouse", "hostel", "retreat center")
  ) {
    const tags: string[] = [];
    if (has("farm")) tags.push("farm-stay");
    else if (has("eco", "green", "regenerative")) tags.push("green-stay");
    else tags.push("stay");
    return { layer: "stay", tags };
  }

  // FOOD (restaurants, cafes)
  if (
    has("restaurant", "cafe", "café", "kitchen", "bistro", "eatery", "diner", "coffee", "bakery", "vegan", "vegetarian")
  ) {
    const tags: string[] = [];
    if (has("vegan")) tags.push("vegan");
    if (has("vegetarian")) tags.push("vegetarian");
    if (has("cafe", "café", "coffee")) tags.push("cafe");
    if (has("bakery")) tags.push("bakery");
    if (has("restaurant", "kitchen", "bistro", "eatery", "diner") && !tags.includes("cafe")) {
      tags.push("restaurant");
    }
    return { layer: "food", tags: tags.length ? tags : ["restaurant"] };
  }

  // GROCERIES
  if (
    has(
      "farmers market",
      "farmer's market",
      "farmer market",
      "co-op",
      "coop",
      "bulk",
      "grocer",
      "food hall",
      "market hall",
      "natural foods",
    )
  ) {
    const tags: string[] = [];
    if (has("farmer")) tags.push("farmers-market");
    if (has("co-op", "coop")) tags.push("co-op");
    if (has("bulk")) tags.push("bulk");
    if (!tags.length) tags.push("grocery");
    return { layer: "groceries", tags };
  }

  // WELLNESS (gyms, baths, yoga, bikes)
  if (
    category === "wellness" ||
    has("yoga", "bath", "sauna", "cold plunge", "gym", "fitness", "pilates", "spa", "bike shop", "cyclery", "bike rental")
  ) {
    const tags: string[] = [];
    if (has("yoga")) tags.push("yoga");
    if (has("bath", "sauna")) tags.push("bath-house");
    if (has("cold plunge", "cold-plunge")) tags.push("cold-plunge");
    if (has("gym", "fitness", "pilates")) tags.push("gym");
    if (has("spa")) tags.push("spa");
    if (has("bike shop", "cyclery", "bike rental")) tags.push("bike-shop");
    if (!tags.length) tags.push("wellness");
    return { layer: "wellness", tags };
  }

  // REGENERATION (farms, gardens, native plants, seed, compost, pottery)
  if (
    category === "environmental" ||
    has(
      "farm",
      "garden",
      "permaculture",
      "regenerative",
      "native plant",
      "seed library",
      "seed bank",
      "compost",
      "nursery",
      "homestead",
      "pottery",
      "ceramic",
      "clay studio",
    )
  ) {
    const tags: string[] = [];
    if (has("native plant", "nursery")) tags.push("native-plants");
    if (has("organic farm", "regenerative farm")) tags.push("organic-farm");
    else if (has("farm")) tags.push("farm");
    if (has("community garden")) tags.push("community-garden");
    else if (has("garden")) tags.push("garden");
    if (has("compost")) tags.push("compost");
    if (has("seed library", "seed bank")) tags.push("seed-library");
    if (has("pottery", "ceramic", "clay studio")) tags.push("pottery");
    if (has("permaculture")) tags.push("permaculture");
    if (!tags.length) tags.push("regeneration");
    return { layer: "regeneration", tags };
  }

  // AWARENESS (galleries, museums, education, art spaces)
  if (
    category === "education" ||
    category === "art" ||
    has("museum", "gallery", "library", "school", "institute", "exhibit", "studio", "art space", "cultural")
  ) {
    const tags: string[] = [];
    if (has("museum")) tags.push("museum");
    if (has("gallery", "art space")) tags.push("gallery");
    if (has("library")) tags.push("library");
    if (has("school", "institute")) tags.push("education");
    if (!tags.length) tags.push("cultural");
    return { layer: "awareness", tags };
  }

  // VENDORS (catch-all for "vendors" category — likely shops/markets)
  if (category === "vendors") {
    return { layer: "groceries", tags: ["shop"] };
  }

  // Default fallback
  return { layer: "awareness", tags: ["misc"] };
}

async function main() {
  console.log("Fetching all attractions...");
  const all = (await client.query(api.attractions.listAllForCurator)) as Array<{
    _id: Id<"attractions">;
    name: string;
    category: string;
    description?: string;
    layer?: Layer;
    publicMap?: boolean;
  }>;

  console.log(`Found ${all.length} attractions.`);

  // 1) Classify any without a layer set
  const toClassify = all
    .filter((a) => !a.layer)
    .map((a) => {
      const c = classify(a.name, a.category, a.description);
      return { id: a._id, layer: c.layer, tags: c.tags };
    });

  if (toClassify.length === 0) {
    console.log("All attractions already classified — skipping classify step.");
  } else {
    console.log(`Classifying ${toClassify.length} attractions...`);
    // Send in batches of 50 to avoid huge mutations
    for (let i = 0; i < toClassify.length; i += 50) {
      const chunk = toClassify.slice(i, i + 50);
      const r = await client.mutation(api.attractions.bulkClassify, { classifications: chunk });
      console.log(`  Batch ${i / 50 + 1}: updated ${r.updated}`);
    }
  }

  // 2) Set publicMap=true for all currently undefined (so /tour stays identical post-migration)
  console.log("Marking all undefined-publicMap attractions as public...");
  const r2 = await client.mutation(api.attractions.setAllPublic, {});
  console.log(`  ${r2.updated} updated (of ${r2.total} total)`);

  // 3) Print summary
  const stats = await client.query(api.attractions.layerStats);
  console.log("\nLayer breakdown:");
  for (const [layer, s] of Object.entries(stats)) {
    console.log(`  ${layer.padEnd(15)} total=${s.total}  public=${s.public}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
