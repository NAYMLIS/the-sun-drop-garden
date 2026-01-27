"use server";

export function verifyAdminPassword(password: string): boolean {
  const adminSecret = process.env.NEXT_PRIVATE_ADMIN_SECRET;

  if (!adminSecret) {
    console.error("NEXT_PRIVATE_ADMIN_SECRET is not set");
    return false;
  }

  return password === adminSecret;
}
