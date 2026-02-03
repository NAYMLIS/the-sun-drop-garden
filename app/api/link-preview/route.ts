import { NextResponse } from "next/server";

interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
}

// Regex patterns - defined at top level for performance
const FAVICON_PATTERNS = [
  /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
  /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i,
];
const TITLE_REGEX = /<title[^>]*>([^<]+)<\/title>/i;

function extractMetaTag(content: string, name: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']`,
    "i"
  );
  const match = content.match(regex);
  return match?.[1] || null;
}

function extractFavicon(html: string, baseUrl: string): string | null {
  // Try various favicon methods
  const patterns = FAVICON_PATTERNS;

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const href = match[1];
      if (href.startsWith("http")) {
        return href;
      }
      if (href.startsWith("//")) {
        return `https:${href}`;
      }
      if (href.startsWith("/")) {
        try {
          const url = new URL(baseUrl);
          return `${url.protocol}//${url.host}${href}`;
        } catch {
          return null;
        }
      }
      return href;
    }
  }

  // Fallback to default favicon location
  try {
    const url = new URL(baseUrl);
    return `${url.protocol}//${url.host}/favicon.ico`;
  } catch {
    return null;
  }
}

function resolveUrl(url: string, baseUrl: string): string {
  if (url.startsWith("http")) {
    return url;
  }
  if (url.startsWith("//")) {
    return `https:${url}`;
  }
  if (url.startsWith("/")) {
    try {
      const base = new URL(baseUrl);
      return `${base.protocol}//${base.host}${url}`;
    } catch {
      return url;
    }
  }
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LinkPreviewBot/1.0; +https://example.com/bot)",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const metadata: LinkMetadata = {};

    // Extract title
    const titleMatch = html.match(TITLE_REGEX);
    if (titleMatch?.[1]) {
      metadata.title = titleMatch[1].trim();
    }

    // Extract Open Graph and Twitter Card meta tags
    metadata.title =
      extractMetaTag(html, "og:title") ||
      extractMetaTag(html, "twitter:title") ||
      metadata.title ||
      undefined;

    metadata.description =
      extractMetaTag(html, "og:description") ||
      extractMetaTag(html, "twitter:description") ||
      extractMetaTag(html, "description") ||
      undefined;

    metadata.image =
      extractMetaTag(html, "og:image") ||
      extractMetaTag(html, "twitter:image") ||
      undefined;

    if (metadata.image) {
      metadata.image = resolveUrl(metadata.image, normalizedUrl);
    }

    // Extract favicon
    metadata.favicon = extractFavicon(html, normalizedUrl) ?? undefined;

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Link preview error:", error);
    return NextResponse.json(
      { error: "Failed to fetch link metadata" },
      { status: 500 }
    );
  }
}
