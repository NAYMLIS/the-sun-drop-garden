import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

interface TourDateData {
  city: string;
  venue: string;
  address: string;
  date: string; // ISO format YYYY-MM-DD
  time: string; // 12-hour format like "7:30 PM"
  ticketLink: string;
}

interface GeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
}

const tourDates: TourDateData[] = [
  {
    city: "Montreal, QC",
    venue: "Théâtre Fairmount",
    address: "5240 Av du Parc, Montréal, QC H2V 4G7, Canada",
    date: "2026-02-19",
    time: "7:30 PM",
    ticketLink: "https://www.universe.com/events/théâtre-fairmount-tickets",
  },
  {
    city: "Toronto, ON",
    venue: "The Garrison",
    address: "1197 Dundas Street West, Toronto, ON M6J 1X3, Canada",
    date: "2026-02-20",
    time: "7:00 PM",
    ticketLink: "https://www.ticketmaster.ca/",
  },
  {
    city: "New York, NY",
    venue: "Sony Hall",
    address: "235 W 46th St, New York, NY 10036",
    date: "2026-02-21",
    time: "6:30 PM",
    ticketLink: "https://www.ticketweb.com/",
  },
  {
    city: "Chicago, IL",
    venue: "Sleeping Village",
    address: "3734 W Belmont Ave, Chicago, IL 60618",
    date: "2026-02-22",
    time: "7:00 PM",
    ticketLink: "https://dice.fm/",
  },
  {
    city: "Miami, FL",
    venue: "ZeyZey Miami",
    address: "353 Northeast 61st Street, Miami, FL 33137",
    date: "2026-02-24",
    time: "7:00 PM",
    ticketLink: "https://shotgun.live/",
  },
  {
    city: "San Francisco, CA",
    venue: "The Independent",
    address: "628 Divisadero St, San Francisco, CA 94117",
    date: "2026-02-26",
    time: "7:30 PM",
    ticketLink: "https://www.ticketweb.com/",
  },
  {
    city: "Los Angeles, CA",
    venue: "Pacific Electric",
    address: "1729 Naud Street, Los Angeles, CA 90012",
    date: "2026-02-28",
    time: "8:00 PM",
    ticketLink: "https://www.ticketmaster.com/",
  },
];

async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number }> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`
    );
    const data = (await response.json()) as GeocodeResult[];
    if (data.length === 0) {
      throw new Error(`No results found for address: ${address}`);
    }
    return {
      lat: Number.parseFloat(data[0].lat),
      lng: Number.parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error(`Geocoding failed for ${address}:`, error);
    throw error;
  }
}

async function addTourDates() {
  // Load environment variables from .env.local
  // Bun automatically loads .env files, but we can also check for NEXT_PUBLIC_CONVEX_URL
  const convexUrl =
    process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  if (!convexUrl) {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL environment variable is not set. Please set it in your .env.local file."
    );
  }

  const client = new ConvexHttpClient(convexUrl);

  console.log("Starting to add tour dates...\n");

  for (const tourDate of tourDates) {
    try {
      console.log(`Processing: ${tourDate.city} - ${tourDate.venue}`);
      console.log(`  Geocoding address: ${tourDate.address}`);

      const { lat, lng } = await geocodeAddress(tourDate.address);

      console.log(`  Coordinates: ${lat}, ${lng}`);
      console.log("  Adding to database...");

      const id = await client.mutation(api.tourDates.add, {
        city: tourDate.city,
        venue: tourDate.venue,
        date: tourDate.date,
        lat,
        lng,
        ticketLink: tourDate.ticketLink,
        address: tourDate.address,
        time: tourDate.time,
      });

      console.log(`  ✓ Successfully added (ID: ${id})\n`);
    } catch (error) {
      console.error(`  ✗ Failed to add ${tourDate.city}:`, error);
      console.error("");
    }
  }

  console.log("Finished adding tour dates!");
}

// Run the script
addTourDates().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
