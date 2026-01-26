import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function spotifyUriToUrl(uri: string): string {
  const parts = uri.split(":");
  if (parts.length !== 3 || parts[0] !== "spotify") {
    return "";
  }
  const [, type, id] = parts;
  return `https://open.spotify.com/${type}/${id}`;
}
