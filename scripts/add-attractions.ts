import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

interface AttractionData {
  name: string;
  city: string;
  category: string;
  address?: string;
}

interface GeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
}

const attractions: AttractionData[] = [
  // Montreal, QC
  {
    name: "Parc du Mont-Royal",
    city: "Montreal, QC",
    category: "environmental",
  },
  {
    name: "Jardin Botanique de Montréal",
    city: "Montreal, QC",
    category: "environmental",
  },
  {
    name: "Santropol Roulant",
    city: "Montreal, QC",
    category: "environmental",
  },
  { name: "Aux Vivres", city: "Montreal, QC", category: "vendors" },
  { name: "La Panthère Verte", city: "Montreal, QC", category: "vendors" },
  { name: "Bulk Barn", city: "Montreal, QC", category: "vendors" },
  { name: "Maison de la culture", city: "Montreal, QC", category: "venues" },
  { name: "McGill University", city: "Montreal, QC", category: "venues" },
  { name: "Canal de Lachine", city: "Montreal, QC", category: "wellness" },
  {
    name: "Auberge Alternative",
    city: "Montreal, QC",
    category: "accommodation",
  },
  { name: "Hotel Zero1", city: "Montreal, QC", category: "accommodation" },

  // Toronto, ON
  {
    name: "Evergreen Brick Works",
    city: "Toronto, ON",
    category: "environmental",
  },
  { name: "High Park", city: "Toronto, ON", category: "environmental" },
  { name: "Fresh Restaurants", city: "Toronto, ON", category: "vendors" },
  { name: "Ethiopian House", city: "Toronto, ON", category: "vendors" },
  { name: "The Big Carrot", city: "Toronto, ON", category: "vendors" },
  { name: "Art Gallery of Ontario", city: "Toronto, ON", category: "venues" },
  { name: "University of Toronto", city: "Toronto, ON", category: "venues" },
  { name: "Don Valley Trails", city: "Toronto, ON", category: "wellness" },
  {
    name: "Planet Traveler Hostel",
    city: "Toronto, ON",
    category: "accommodation",
  },
  { name: "The Anndore House", city: "Toronto, ON", category: "accommodation" },

  // New York, NY
  { name: "Central Park", city: "New York, NY", category: "environmental" },
  { name: "Brooklyn Grange", city: "New York, NY", category: "environmental" },
  {
    name: "Queens Botanical Garden",
    city: "New York, NY",
    category: "environmental",
  },
  { name: "Dirt Candy", city: "New York, NY", category: "vendors" },
  { name: "Bunna Cafe", city: "New York, NY", category: "vendors" },
  { name: "Kalustyan's", city: "New York, NY", category: "vendors" },
  { name: "Brooklyn Public Library", city: "New York, NY", category: "venues" },
  { name: "The Shed", city: "New York, NY", category: "venues" },
  { name: "Hudson River Greenway", city: "New York, NY", category: "wellness" },
  { name: "The Local NY", city: "New York, NY", category: "accommodation" },
  {
    name: "1 Hotel Brooklyn Bridge",
    city: "New York, NY",
    category: "accommodation",
  },

  // Chicago, IL
  {
    name: "Garfield Park Conservatory",
    city: "Chicago, IL",
    category: "environmental",
  },
  { name: "Humboldt Park", city: "Chicago, IL", category: "environmental" },
  { name: "Handlebar", city: "Chicago, IL", category: "vendors" },
  { name: "Ethiopian Diamond", city: "Chicago, IL", category: "vendors" },
  { name: "Uncommon Ground", city: "Chicago, IL", category: "vendors" },
  { name: "Chicago Cultural Center", city: "Chicago, IL", category: "venues" },
  { name: "University of Chicago", city: "Chicago, IL", category: "venues" },
  { name: "Lakefront Trail", city: "Chicago, IL", category: "wellness" },
  { name: "HI Chicago Hostel", city: "Chicago, IL", category: "accommodation" },
  { name: "Hotel Zachary", city: "Chicago, IL", category: "accommodation" },

  // Miami, FL
  {
    name: "Everglades National Park",
    city: "Miami, FL",
    category: "environmental",
  },
  {
    name: "Fairchild Tropical Botanic Garden",
    city: "Miami, FL",
    category: "environmental",
  },
  { name: "Plant Miami", city: "Miami, FL", category: "vendors" },
  { name: "Love Life Cafe", city: "Miami, FL", category: "vendors" },
  { name: "The Kampong", city: "Miami, FL", category: "venues" },
  { name: "University of Miami", city: "Miami, FL", category: "venues" },
  { name: "Miami Beach Boardwalk", city: "Miami, FL", category: "wellness" },
  {
    name: "Treehouse Hotel Miami",
    city: "Miami, FL",
    category: "accommodation",
  },
  { name: "Freehand Miami", city: "Miami, FL", category: "accommodation" },

  // San Francisco, CA
  {
    name: "Golden Gate Park",
    city: "San Francisco, CA",
    category: "environmental",
  },
  {
    name: "SF Botanical Garden",
    city: "San Francisco, CA",
    category: "environmental",
  },
  {
    name: "Alemany Farm",
    city: "San Francisco, CA",
    category: "environmental",
  },
  { name: "Gracias Madre", city: "San Francisco, CA", category: "vendors" },
  { name: "Ananda Fuara", city: "San Francisco, CA", category: "vendors" },
  { name: "Rainbow Grocery", city: "San Francisco, CA", category: "vendors" },
  { name: "Exploratorium", city: "San Francisco, CA", category: "venues" },
  { name: "SF Public Library", city: "San Francisco, CA", category: "venues" },
  { name: "Bay Trail", city: "San Francisco, CA", category: "wellness" },
  {
    name: "Green Tortoise Hostel",
    city: "San Francisco, CA",
    category: "accommodation",
  },
  {
    name: "Hotel Kabuki",
    city: "San Francisco, CA",
    category: "accommodation",
  },

  // Los Angeles, CA
  { name: "Griffith Park", city: "Los Angeles, CA", category: "environmental" },
  { name: "LA Arboretum", city: "Los Angeles, CA", category: "environmental" },
  { name: "TreePeople", city: "Los Angeles, CA", category: "environmental" },
  { name: "Cafe Gratitude", city: "Los Angeles, CA", category: "vendors" },
  {
    name: "Rahel Ethiopian Vegan Cuisine",
    city: "Los Angeles, CA",
    category: "vendors",
  },
  { name: "Erewhon Market", city: "Los Angeles, CA", category: "vendors" },
  { name: "Getty Center", city: "Los Angeles, CA", category: "venues" },
  { name: "UCLA", city: "Los Angeles, CA", category: "venues" },
  { name: "LA River Greenway", city: "Los Angeles, CA", category: "wellness" },
  {
    name: "The Bungalow Hostel",
    city: "Los Angeles, CA",
    category: "accommodation",
  },
  {
    name: "Hotel Figueroa",
    city: "Los Angeles, CA",
    category: "accommodation",
  },
];

async function geocodeAttraction(
  name: string,
  city: string
): Promise<{ lat: number; lng: number; address?: string }> {
  try {
    // Try searching with name and city first
    let query = `${name}, ${city}`;
    let response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`
    );
    let data = (await response.json()) as GeocodeResult[];

    // If no results, try just the name in the city
    if (data.length === 0) {
      query = `${name}`;
      response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      data = (await response.json()) as GeocodeResult[];

      // Filter results to only include those in the same city/state
      const cityLower = city.toLowerCase();
      const filtered = data.filter((result) =>
        result.display_name.toLowerCase().includes(cityLower)
      );
      if (filtered.length > 0) {
        data = filtered;
      }
    }

    if (data.length === 0) {
      throw new Error(`No results found for: ${name}, ${city}`);
    }

    return {
      lat: Number.parseFloat(data[0].lat),
      lng: Number.parseFloat(data[0].lon),
      address: data[0].display_name,
    };
  } catch (error) {
    console.error(`Geocoding failed for ${name}, ${city}:`, error);
    throw error;
  }
}

async function addAttractions() {
  const convexUrl =
    process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  if (!convexUrl) {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL environment variable is not set. Please set it in your .env.local file."
    );
  }

  const client = new ConvexHttpClient(convexUrl);

  console.log("Starting to add community attractions...\n");
  console.log(`Total attractions to add: ${attractions.length}\n`);

  let successCount = 0;
  let failureCount = 0;
  const failures: Array<{ name: string; city: string; error: string }> = [];

  for (const attraction of attractions) {
    try {
      console.log(`Processing: ${attraction.name} - ${attraction.city}`);
      console.log(`  Category: ${attraction.category}`);
      console.log("  Geocoding location...");

      const { lat, lng, address } = await geocodeAttraction(
        attraction.name,
        attraction.city
      );

      console.log(`  Coordinates: ${lat}, ${lng}`);
      if (address) {
        console.log(`  Address: ${address}`);
      }
      console.log("  Adding to database...");

      const id = await client.mutation(api.attractions.add, {
        name: attraction.name,
        city: attraction.city,
        category: attraction.category,
        lat,
        lng,
        address: address || undefined,
      });

      console.log(`  ✓ Successfully added (ID: ${id})\n`);
      successCount++;

      // Small delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`  ✗ Failed to add ${attraction.name}:`, errorMessage);
      console.error("");
      failureCount++;
      failures.push({
        name: attraction.name,
        city: attraction.city,
        error: errorMessage,
      });

      // Still add delay even on failure
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log("Summary:");
  console.log(`  Successfully added: ${successCount}`);
  console.log(`  Failed: ${failureCount}`);
  console.log("=".repeat(50));

  if (failures.length > 0) {
    console.log("\nFailed attractions:");
    for (const failure of failures) {
      console.log(`  - ${failure.name} (${failure.city}): ${failure.error}`);
    }
  }

  console.log("\nFinished adding attractions!");
}

// Run the script
addAttractions().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
