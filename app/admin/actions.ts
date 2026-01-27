"use server";

// biome-ignore lint/suspicious/useAwait: Next.js Server Actions must be async
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const adminSecret = process.env.NEXT_PRIVATE_ADMIN_SECRET;

  if (!adminSecret) {
    console.error("NEXT_PRIVATE_ADMIN_SECRET is not set");
    return false;
  }

  return password === adminSecret;
}
