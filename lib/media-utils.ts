export type LinkType =
  | "youtube"
  | "soundcloud"
  | "bandcamp"
  | "vimeo"
  | "spotify"
  | "generic";

// Regex patterns - defined at top level for performance
const HTTP_PROTOCOL_REGEX = /^https?:\/\//i;
const YOUTUBE_PATTERNS = [
  /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/i,
  /^(https?:\/\/)?youtube\.com\/watch/i,
  /^(https?:\/\/)?youtu\.be\//i,
];
const SOUNDCLOUD_REGEX = /^(https?:\/\/)?(www\.)?soundcloud\.com/i;
const BANDCAMP_REGEX = /^(https?:\/\/)?[^.]+\.bandcamp\.com/i;
const VIMEO_REGEX = /^(https?:\/\/)?(www\.)?vimeo\.com/i;
const SPOTIFY_REGEX = /^(https?:\/\/)?(open\.)?spotify\.com/i;
const YOUTUBE_ID_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/i,
  /youtube\.com\/embed\/([^&\n?#]+)/i,
  /youtube\.com\/v\/([^&\n?#]+)/i,
];
const SOUNDCLOUD_PATH_REGEX = /soundcloud\.com\/(.+)/i;
const BANDCAMP_PATH_REGEX = /bandcamp\.com\/(.+)/i;
const VIMEO_ID_PATTERNS = [/vimeo\.com\/(\d+)/i, /vimeo\.com\/video\/(\d+)/i];
const SPOTIFY_ID_PATTERN =
  /spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/i;

/**
 * Normalizes a URL by adding https:// if no protocol is present
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }
  // If it already has a protocol, return as-is
  if (HTTP_PROTOCOL_REGEX.test(trimmed)) {
    return trimmed;
  }
  // Otherwise, add https://
  return `https://${trimmed}`;
}

export function detectLinkType(url: string): LinkType {
  const normalized = normalizeUrl(url);
  if (isYouTubeUrl(normalized)) {
    return "youtube";
  }
  if (isSoundCloudUrl(normalized)) {
    return "soundcloud";
  }
  if (isBandcampUrl(normalized)) {
    return "bandcamp";
  }
  if (isVimeoUrl(normalized)) {
    return "vimeo";
  }
  if (isSpotifyUrl(normalized)) {
    return "spotify";
  }
  return "generic";
}

export function isYouTubeUrl(url: string): boolean {
  return YOUTUBE_PATTERNS.some((pattern) => pattern.test(url));
}

export function isSoundCloudUrl(url: string): boolean {
  return SOUNDCLOUD_REGEX.test(url);
}

export function isBandcampUrl(url: string): boolean {
  return BANDCAMP_REGEX.test(url);
}

export function isVimeoUrl(url: string): boolean {
  return VIMEO_REGEX.test(url);
}

export function isSpotifyUrl(url: string): boolean {
  return SPOTIFY_REGEX.test(url);
}

export function extractYouTubeId(url: string): string | null {
  for (const pattern of YOUTUBE_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

export function extractSoundCloudId(url: string): string | null {
  // SoundCloud URLs are typically: https://soundcloud.com/user/track-name
  // We'll use the full path as the identifier
  const match = url.match(SOUNDCLOUD_PATH_REGEX);
  return match?.[1] || null;
}

export function extractBandcampId(url: string): string | null {
  // Bandcamp URLs are typically: https://artist.bandcamp.com/album/album-name
  // or https://artist.bandcamp.com/track/track-name
  // We'll use the full path as the identifier
  const match = url.match(BANDCAMP_PATH_REGEX);
  return match?.[1] || null;
}

export function extractVimeoId(url: string): string | null {
  for (const pattern of VIMEO_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    return null;
  }
  return `https://www.youtube.com/embed/${videoId}`;
}

export function getSoundCloudEmbedUrl(url: string): string {
  // SoundCloud embed format: https://w.soundcloud.com/player/?url=...
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
}

export function getBandcampEmbedUrl(url: string): string {
  // Bandcamp embed format: https://bandcamp.com/EmbeddedPlayer/?url=ENCODED_URL
  // This works for both tracks and albums
  const encodedUrl = encodeURIComponent(url);
  return `https://bandcamp.com/EmbeddedPlayer/?url=${encodedUrl}&size=large&bgcol=ffffff&linkcol=0687f5&artwork=small&transparent=true`;
}

export function getVimeoEmbedUrl(url: string): string | null {
  const videoId = extractVimeoId(url);
  if (!videoId) {
    return null;
  }
  return `https://player.vimeo.com/video/${videoId}`;
}

export function extractSpotifyId(url: string): {
  type: "track" | "album" | "playlist" | "artist";
  id: string;
} | null {
  // Spotify URLs: open.spotify.com/track/ID, open.spotify.com/album/ID, etc.
  const match = url.match(SPOTIFY_ID_PATTERN);
  if (match?.[1] && match?.[2]) {
    return {
      type: match[1].toLowerCase() as "track" | "album" | "playlist" | "artist",
      id: match[2],
    };
  }

  return null;
}

export function getSpotifyEmbedUrl(url: string): string | null {
  const spotifyData = extractSpotifyId(url);
  if (!spotifyData) {
    return null;
  }
  return `https://open.spotify.com/embed/${spotifyData.type}/${spotifyData.id}?utm_source=generator`;
}
