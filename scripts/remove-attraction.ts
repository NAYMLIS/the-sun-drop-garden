import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const [name, city] = process.argv.slice(2);
if (!(name && city)) {
  console.error("Usage: bun run scripts/remove-attraction.ts <name> <city>");
  process.exit(1);
}

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
if (!convexUrl) {
  console.error("NEXT_PUBLIC_CONVEX_URL not set");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);
const id = await client.mutation(api.attractions.removeByNameAndCity, {
  name,
  city,
});
console.log(id ? `Removed ${name}` : `Not found: ${name} (${city})`);
