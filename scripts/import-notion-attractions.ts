import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

interface GeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
}

const CATEGORY_MAP: Record<string, string> = {
  services: "services",
  vendor: "vendors",
  accommodation: "accommodation",
  environmental: "environmental",
  wellness: "wellness",
  "art/culture": "art",
  venue: "venues",
  "education/science": "education",
  miscellaneous: "miscellaneous",
};

const CITY_MAP: Record<string, string> = {
  montreal: "Montreal, QC",
  toronto: "Toronto, ON",
  "new york": "New York, NY",
};

const ADDRESS_SUFFIX_REGEX =
  /\s*(#\d+|Suite\s+\d+|3rd\s+floor|2nd\s+floor)\s*$/i;

const CATEGORY_SPLIT_REGEX = /[,;]/;

function parseCSV(content: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (const c of content) {
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === "," && !inQuotes) || (c === "\n" && !inQuotes)) {
      row.push(cell.trim());
      cell = "";
      if (c === "\n") {
        rows.push(row);
        row = [];
      }
    } else if (c !== "\r") {
      cell += c;
    }
  }
  if (cell || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  const headers = rows[0] ?? [];
  return rows.slice(1).map((values) => {
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j] ?? ""] = values[j] ?? "";
    }
    return obj;
  });
}

function mapCategory(notionCategory: string): string {
  const first =
    notionCategory.split(CATEGORY_SPLIT_REGEX)[0]?.trim().toLowerCase() ?? "";
  return CATEGORY_MAP[first] ?? "miscellaneous";
}

function mapCity(notionCity: string): string {
  const key = notionCity.trim().toLowerCase();
  return CITY_MAP[key] ?? notionCity;
}

const CITY_BOUNDS: Record<
  string,
  { lat: [number, number]; lng: [number, number] }
> = {
  "Montreal, QC": { lat: [45.4, 45.7], lng: [-73.9, -73.4] },
  "Toronto, ON": { lat: [43.5, 43.9], lng: [-79.6, -79.1] },
  "New York, NY": { lat: [40.5, 40.95], lng: [-74.25, -73.7] },
};

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  "Montreal, QC": { lat: 45.5017, lng: -73.5673 },
  "Toronto, ON": { lat: 43.6532, lng: -79.3832 },
  "New York, NY": { lat: 40.7128, lng: -74.006 },
};

function isInCity(lat: number, lng: number, city: string): boolean {
  const bounds = CITY_BOUNDS[city];
  if (!bounds) {
    return true;
  }
  return (
    lat >= bounds.lat[0] &&
    lat <= bounds.lat[1] &&
    lng >= bounds.lng[0] &&
    lng <= bounds.lng[1]
  );
}

async function geocodeAddress(
  address: string,
  name: string,
  city: string
): Promise<{ lat: number; lng: number; address?: string }> {
  const simplifiedAddress = address.replace(ADDRESS_SUFFIX_REGEX, "").trim();
  const queries = [
    address,
    simplifiedAddress !== address ? simplifiedAddress : null,
    `${name}, ${city}`,
  ].filter((q): q is string => Boolean(q));

  for (const query of queries) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
    );
    const data = (await response.json()) as GeocodeResult[];
    const inCity = data.find((r) =>
      isInCity(Number.parseFloat(r.lat), Number.parseFloat(r.lon), city)
    );
    if (inCity) {
      return {
        lat: Number.parseFloat(inCity.lat),
        lng: Number.parseFloat(inCity.lon),
        address: inCity.display_name,
      };
    }
    if (data.length > 0 && !CITY_BOUNDS[city]) {
      return {
        lat: Number.parseFloat(data[0].lat),
        lng: Number.parseFloat(data[0].lon),
        address: data[0].display_name,
      };
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  const center = CITY_CENTERS[city];
  if (center) {
    console.warn(
      `  ⚠ Using city center for ${name} (geocoding failed for: ${address || "N/A"})`
    );
    return { lat: center.lat, lng: center.lng, address };
  }

  throw new Error(`No results found for: ${address || `${name}, ${city}`}`);
}

async function processRow(
  row: Record<string, string>,
  client: ConvexHttpClient,
  existingKeys: Set<string>
): Promise<"success" | "skipped" | "failed"> {
  const name = row["Place Name"]?.trim();
  const city = mapCity(row.City ?? "");
  const category = mapCategory(row.Category ?? "");
  const address = row.Address?.trim();
  const description = row.Description?.trim();

  if (!name) {
    return "skipped";
  }

  const key = `${name.toLowerCase()}|${city}`;
  if (existingKeys.has(key)) {
    return "skipped";
  }

  const {
    lat,
    lng,
    address: geocodedAddress,
  } = await geocodeAddress(address ?? "", name, city);

  await client.mutation(api.attractions.add, {
    name,
    city,
    category,
    lat,
    lng,
    address: geocodedAddress ?? address ?? undefined,
    description: description || undefined,
  });

  existingKeys.add(key);
  return "success";
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: script with multiple branches
async function importAttractions() {
  let rows: Record<string, string>[];
  let client: ConvexHttpClient;
  let existingKeys: Set<string>;

  try {
    const csvPath =
      process.argv[2] ?? resolve(import.meta.dir, "../data/notion-places.csv");
    const content = readFileSync(csvPath, "utf-8");
    rows = parseCSV(content);
    const convexUrl =
      process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
    if (!convexUrl) {
      throw new Error(
        "NEXT_PUBLIC_CONVEX_URL environment variable is not set. Set it in .env.local"
      );
    }
    client = new ConvexHttpClient(convexUrl);
    const existing = (await client.query(api.attractions.list)) as Array<{
      name: string;
      city: string;
    }>;
    existingKeys = new Set(
      existing.map((a) => `${a.name.toLowerCase()}|${a.city}`)
    );
  } catch (error) {
    const csvPath =
      process.argv[2] ?? resolve(import.meta.dir, "../data/notion-places.csv");
    console.error(`Failed to load: ${csvPath}`, error);
    process.exit(1);
  }

  console.log(`Found ${rows.length} places in CSV\n`);

  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;
  const failures: Array<{ name: string; city: string; error: string }> = [];

  for (const row of rows) {
    const name = row["Place Name"]?.trim();
    const city = mapCity(row.City ?? "");
    const key = name ? `${name.toLowerCase()}|${city}` : "";

    if (!name) {
      console.log("Skipping row with empty Place Name");
      continue;
    }

    if (existingKeys.has(key)) {
      console.log(`Skipping (exists): ${name} - ${city}`);
      skippedCount++;
      continue;
    }

    try {
      console.log(`Processing: ${name} - ${city}`);
      console.log(`  Category: ${mapCategory(row.Category ?? "")}`);
      const result = await processRow(row, client, existingKeys);
      if (result === "success") {
        console.log("  ✓ Added\n");
        successCount++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`  ✗ Failed: ${errorMessage}\n`);
      failureCount++;
      failures.push({ name, city, error: errorMessage });
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`${"=".repeat(50)}`);
  console.log("Summary:");
  console.log(`  Added: ${successCount}`);
  console.log(`  Skipped (already exist): ${skippedCount}`);
  console.log(`  Failed: ${failureCount}`);
  console.log("=".repeat(50));

  if (failures.length > 0) {
    console.log("\nFailed:");
    for (const f of failures) {
      console.log(`  - ${f.name} (${f.city}): ${f.error}`);
    }
  }
}

importAttractions().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
