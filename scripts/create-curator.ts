import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const URL = process.env.NEXT_PUBLIC_CONVEX_URL!;
const client = new ConvexHttpClient(URL);

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4];
  if (!email || !password) {
    console.error("Usage: bun run /tmp/create_curator.ts <email> <password> [displayName]");
    process.exit(1);
  }
  try {
    const id = await client.mutation(api.curators.createCurator, { email, password, displayName: name });
    console.log(`Created curator ${email} with id ${id}`);
  } catch (e: any) {
    if (e.message?.includes("already exists")) {
      console.log(`Account exists. Resetting password for ${email}...`);
      await client.mutation(api.curators.setPassword, { email, newPassword: password });
      console.log("Password reset.");
    } else {
      throw e;
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
