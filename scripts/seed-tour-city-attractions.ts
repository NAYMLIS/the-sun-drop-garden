/**
 * Seed Tour-City Attractions
 * --------------------------
 * Curated regenerative / wellness / education / community spots in each
 * tour city so the "Community" dropdown on each tour-date card has
 * meaningful local picks (with colored category chips).
 *
 * Each `city` value MUST match the tour-date `city` exactly, otherwise
 * the dropdown won't pick them up (see app/tour/tour-content.tsx:120).
 *
 * Run:  bun scripts/seed-tour-city-attractions.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as fs from "node:fs";
import * as path from "node:path";

const PROTOCOL = /^https?:\/\//;
const TRAILING = /\/$/;

const envText = fs.readFileSync(path.resolve(__dirname, "../.env.local"), "utf8");
const convexUrl = envText
  .split("\n")
  .find((l) => l.startsWith("NEXT_PUBLIC_CONVEX_URL="))
  ?.split("=")[1]
  ?.trim();
if (!convexUrl) {
  console.error("NEXT_PUBLIC_CONVEX_URL missing");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

interface Spot {
  name: string;
  lat: number;
  lng: number;
  category:
    | "environmental"
    | "wellness"
    | "education"
    | "art"
    | "accommodation"
    | "vendors"
    | "venues"
    | "services"
    | "miscellaneous";
  city: string; // MUST match a tour-date city
  description: string;
  address?: string;
}

const spots: Spot[] = [
  // ============================================================
  // MONTREAL, QC
  // ============================================================
  {
    name: "Santropol Roulant",
    lat: 45.5176,
    lng: -73.5752,
    category: "environmental",
    city: "Montreal, QC",
    description:
      "Intergenerational urban farm and meals-on-wheels collective on the Plateau. Rooftop gardens, food sovereignty work, and a youth-driven model of bioregional care.",
  },
  {
    name: "Centre Greene Community Centre",
    lat: 45.4855,
    lng: -73.5821,
    category: "education",
    city: "Montreal, QC",
    description:
      "Long-running grassroots community hub running ecological literacy classes, climate-action workshops, and intergenerational programs.",
  },
  {
    name: "Espace pour la vie · Biodôme",
    lat: 45.5598,
    lng: -73.55,
    category: "education",
    city: "Montreal, QC",
    description:
      "Living-ecosystem museum housing five Americas biomes under one roof. Stunning, immersive way to study regeneration without leaving the city.",
  },
  {
    name: "Auberge Saint-Gabriel · Resilient Hospitality",
    lat: 45.5063,
    lng: -73.5556,
    category: "accommodation",
    city: "Montreal, QC",
    description:
      "Old Montreal's heritage inn turned local-food showcase. Historic inn with deep ties to Quebec's terroir and farm-to-table community.",
  },
  {
    name: "PHI Centre",
    lat: 45.5036,
    lng: -73.5547,
    category: "art",
    city: "Montreal, QC",
    description:
      "Multidisciplinary art and ideas centre championing immersive experiences, climate-aware programming, and Indigenous voices.",
  },
  {
    name: "Café Aunja · Wellness Tea House",
    lat: 45.5028,
    lng: -73.5717,
    category: "wellness",
    city: "Montreal, QC",
    description:
      "Persian tea-house and quiet sanctuary near McGill — a beloved corner for slow rituals between tour-night stimulation.",
  },

  // ============================================================
  // TORONTO, ON
  // ============================================================
  {
    name: "Evergreen Brick Works",
    lat: 43.6849,
    lng: -79.3661,
    category: "environmental",
    city: "Toronto, ON",
    description:
      "Reclaimed brick-factory turned premier urban-ecology hub. Native gardens, weekend farmers market, and Canada's flagship green infrastructure showcase.",
  },
  {
    name: "Riverdale Farm",
    lat: 43.6669,
    lng: -79.3633,
    category: "education",
    city: "Toronto, ON",
    description:
      "City-run heritage farm in Cabbagetown. Free, open every day — sheep, cows, draft horses, and a portal to where Toronto's land used to feed itself.",
  },
  {
    name: "FoodShare Toronto",
    lat: 43.6532,
    lng: -79.4081,
    category: "education",
    city: "Toronto, ON",
    description:
      "BIPOC-led food-justice powerhouse. Mobile good-food markets, urban agriculture, and curriculum reshaping how Toronto eats.",
  },
  {
    name: "The Spadina Hotel · The Garrison Block",
    lat: 43.6483,
    lng: -79.4225,
    category: "venues",
    city: "Toronto, ON",
    description:
      "Historic strip around Dundas West — galleries, studios, and the music block that shaped Toronto's indie scene. Walk the venue's neighborhood.",
  },
  {
    name: "Yoga Tree · Queen West",
    lat: 43.6486,
    lng: -79.4236,
    category: "wellness",
    city: "Toronto, ON",
    description:
      "Beloved donation-based community yoga studio steps from The Garrison. Drop in for a reset before sound check.",
  },
  {
    name: "Annette · Plant-Forward Bistro",
    lat: 43.6675,
    lng: -79.4687,
    category: "vendors",
    city: "Toronto, ON",
    description:
      "Farm-driven, plant-leaning kitchen highlighting Ontario growers. A favorite of touring musicians and the regenerative food crowd.",
  },

  // ============================================================
  // NEW YORK, NY
  // ============================================================
  {
    name: "Brooklyn Grange Sunset Park",
    lat: 40.6552,
    lng: -74.0089,
    category: "environmental",
    city: "New York, NY",
    description:
      "World's largest soil-based rooftop farm — 5.6 acres above the city. Tours, weddings, and a model for what every NYC roof could become.",
  },
  {
    name: "GrowNYC · Greenmarkets",
    lat: 40.7359,
    lng: -73.9911,
    category: "vendors",
    city: "New York, NY",
    description:
      "Network of 50+ farmers markets across the five boroughs. Union Square is the flagship — meet the Hudson Valley regenerative farm scene.",
  },
  {
    name: "The Battery Urban Farm",
    lat: 40.7032,
    lng: -74.0166,
    category: "education",
    city: "New York, NY",
    description:
      "One-acre educational farm at Manhattan's southern tip, growing food for kids who've never seen a tomato vine. Free, open daily.",
  },
  {
    name: "Integral Yoga Institute",
    lat: 40.7388,
    lng: -74.0029,
    category: "wellness",
    city: "New York, NY",
    description:
      "West Village pioneer of community yoga — affordable classes, vegan café, and decades of refuge from the city's intensity.",
  },
  {
    name: "Center for Architecture",
    lat: 40.7301,
    lng: -73.9974,
    category: "education",
    city: "New York, NY",
    description:
      "Hub for sustainable-design exhibits and lectures. Where NYC's regenerative architecture conversation lives.",
  },
  {
    name: "The Hoxton Williamsburg",
    lat: 40.7152,
    lng: -73.9605,
    category: "accommodation",
    city: "New York, NY",
    description:
      "Brooklyn-rooftop hotel with one of the better climate-conscious operations in NYC hospitality.",
  },
  {
    name: "Pioneer Works",
    lat: 40.6803,
    lng: -74.013,
    category: "art",
    city: "New York, NY",
    description:
      "Red Hook's interdisciplinary art-and-science temple. Residencies for musicians, scientists, and ecologists working at the edge.",
  },

  // ============================================================
  // CHICAGO, IL
  // ============================================================
  {
    name: "The Plant · Vertical Farm",
    lat: 41.8108,
    lng: -87.6586,
    category: "environmental",
    city: "Chicago, IL",
    description:
      "Closed-loop food incubator inside a former meatpacking plant. Aquaponics, kombucha brewery, and a model for circular urban industry.",
  },
  {
    name: "Garfield Park Conservatory",
    lat: 41.8865,
    lng: -87.7172,
    category: "education",
    city: "Chicago, IL",
    description:
      "Historic 4.5-acre glass conservatory. Among the largest conservatories in America — free, transformative, and a sanctuary mid-winter tour.",
  },
  {
    name: "Growing Home · Wood Street Urban Farm",
    lat: 41.7794,
    lng: -87.6717,
    category: "education",
    city: "Chicago, IL",
    description:
      "Englewood-based job-training organic farm. Equity-rooted regeneration on Chicago's South Side.",
  },
  {
    name: "Logan Square Farmers Market",
    lat: 41.9308,
    lng: -87.7081,
    category: "vendors",
    city: "Chicago, IL",
    description:
      "Vibrant year-round market two miles from Sleeping Village. Midwest regenerative farms, fermenters, and herbalists.",
  },
  {
    name: "The Drift Studio · Yoga & Sound",
    lat: 41.9398,
    lng: -87.7144,
    category: "wellness",
    city: "Chicago, IL",
    description:
      "Sound bath and breathwork studio in Logan Square — perfect pre-show grounding within walking distance of the venue.",
  },
  {
    name: "Co-Prosperity Sphere",
    lat: 41.836,
    lng: -87.6692,
    category: "art",
    city: "Chicago, IL",
    description:
      "Bridgeport's grassroots arts hub. Small-press publishing, underground music, and a beating heart of Chicago's DIY creative ecology.",
  },

  // ============================================================
  // MIAMI, FL
  // ============================================================
  {
    name: "Earth 'n Us Farm",
    lat: 25.835,
    lng: -80.1933,
    category: "environmental",
    city: "Miami, FL",
    description:
      "Permaculture micro-farm and tree-house community in Little Haiti — three blocks from ZeyZey. Tours, tropical food forest, urban regeneration legend.",
  },
  {
    name: "Paradise Plant Lab",
    lat: 25.8211,
    lng: -80.196,
    category: "vendors",
    city: "Miami, FL",
    description:
      "Female-led tropical plant nursery and design studio. Living homes via houseplant culture in subtropical Miami.",
  },
  {
    name: "Pinecrest Gardens",
    lat: 25.6564,
    lng: -80.305,
    category: "education",
    city: "Miami, FL",
    description:
      "20-acre former Parrot Jungle — now a public botanical garden, splash pad, and farmers market hub. South Miami's most beloved green space.",
  },
  {
    name: "Bhakti Center Miami",
    lat: 25.8131,
    lng: -80.1908,
    category: "wellness",
    city: "Miami, FL",
    description:
      "Heart-opening kirtan, yoga, and Ayurvedic kitchen blocks from ZeyZey. Devotional community Miami didn't know it needed.",
  },
  {
    name: "Wynwood Walls",
    lat: 25.801,
    lng: -80.1989,
    category: "art",
    city: "Miami, FL",
    description:
      "Open-air street-art museum that put Miami's mural scene on the world map. Walk it before the show — it's two blocks from ZeyZey.",
  },
  {
    name: "Soneva In Aqua · Rooftop Botanical",
    lat: 25.7943,
    lng: -80.1922,
    category: "accommodation",
    city: "Miami, FL",
    description:
      "Edition Hotel Miami — sustainability-forward rooftop with native plant garden + ocean view. A high-touch base for tour stops.",
  },

  // ============================================================
  // SAN FRANCISCO, CA
  // ============================================================
  {
    name: "Alemany Farm",
    lat: 37.7236,
    lng: -122.42,
    category: "environmental",
    city: "San Francisco, CA",
    description:
      "Largest urban farm in SF — 4.5 acres in the Bernal Heights cut. All-volunteer-run, all produce free to the community. Drop-in workdays Saturdays.",
  },
  {
    name: "Hayes Valley Farm Legacy · Black Sands Brewery Garden",
    lat: 37.7715,
    lng: -122.4308,
    category: "vendors",
    city: "San Francisco, CA",
    description:
      "Permaculture demo plot born from the freeway-removal era. Edible wall, native pollinators, brewery onsite — three blocks from The Independent.",
  },
  {
    name: "Conservatory of Flowers",
    lat: 37.7723,
    lng: -122.4604,
    category: "education",
    city: "San Francisco, CA",
    description:
      "Golden Gate Park's 1879 Victorian glass conservatory. One of the oldest in North America, with rare orchid and aquatic plant collections.",
  },
  {
    name: "Yoga Tree · Hayes",
    lat: 37.7751,
    lng: -122.4295,
    category: "wellness",
    city: "San Francisco, CA",
    description:
      "Pre-show vinyasa or restorative steps from Divisadero. Donation-friendly community classes.",
  },
  {
    name: "Gray Area Foundation",
    lat: 37.7711,
    lng: -122.4233,
    category: "art",
    city: "San Francisco, CA",
    description:
      "Mission-district tech-and-art incubator. Ecological-design education, AI-and-art residencies, and the city's most thoughtful evening lectures.",
  },
  {
    name: "Tartine Manufactory",
    lat: 37.762,
    lng: -122.4117,
    category: "vendors",
    city: "San Francisco, CA",
    description:
      "Heritage-grain bakery rooted in regenerative wheat sourcing. Chad Robertson's flour philosophy in baked-good form.",
  },

  // ============================================================
  // LOS ANGELES, CA
  // ============================================================
  {
    name: "The Ecology Center · LA",
    lat: 34.0628,
    lng: -118.2228,
    category: "education",
    city: "Los Angeles, CA",
    description:
      "Sister to OC Ecology Center — regenerative farm pop-ups, kids' programs, and community meals around the Arts District / Chinatown nexus.",
  },
  {
    name: "ROW DTLA · Smorgasburg",
    lat: 34.0327,
    lng: -118.234,
    category: "vendors",
    city: "Los Angeles, CA",
    description:
      "Sunday farmers and small-makers market downtown. Flagship of LA's regenerative-food vendor culture.",
  },
  {
    name: "Wisdome LA · Immersive Domes",
    lat: 34.0697,
    lng: -118.2316,
    category: "art",
    city: "Los Angeles, CA",
    description:
      "Five geodesic domes for immersive art and music near Pacific Electric. Otherworldly, sound-forward, gorgeous adjacent venue energy.",
  },
  {
    name: "The Springs LA",
    lat: 34.0335,
    lng: -118.2347,
    category: "wellness",
    city: "Los Angeles, CA",
    description:
      "Wellness collective with infrared sauna, sound baths, plant-based café, and yoga in the Arts District. Walking distance from the venue.",
  },
  {
    name: "Apricot Lane Farms (Moorpark)",
    lat: 34.4658,
    lng: -119.0397,
    category: "environmental",
    city: "Los Angeles, CA",
    description:
      "Subject of 'The Biggest Little Farm.' One hour from LA — biodynamic regeneration of 234 acres. Tours bookable on weekends.",
  },
  {
    name: "Grand Park Adjacency · Civic Eco-Plantings",
    lat: 34.0577,
    lng: -118.2459,
    category: "environmental",
    city: "Los Angeles, CA",
    description:
      "Recently redesigned native-California plantings around Grand Park. Walk-through case study in drought-aware urban regeneration.",
  },
];

async function main() {
  console.log(`Seeding ${spots.length} tour-city attractions...`);

  const existing = await client.query(api.attractions.list, {});
  const existingNames = new Set(existing.map((a: any) => a.name));

  let inserted = 0;
  let skipped = 0;
  for (const spot of spots) {
    if (existingNames.has(spot.name)) {
      skipped++;
      continue;
    }
    try {
      await client.mutation(api.attractions.add, {
        name: spot.name,
        lat: spot.lat,
        lng: spot.lng,
        category: spot.category,
        city: spot.city,
        description: spot.description,
        address: spot.address,
      });
      inserted++;
      process.stdout.write(".");
    } catch (err: any) {
      console.error(`\nFailed: ${spot.name}: ${err.message}`);
    }
  }

  console.log(`\n✅ Inserted ${inserted}, skipped ${skipped}`);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
