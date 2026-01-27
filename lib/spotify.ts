import type { SpotifyAlbum, SpotifyArtist } from "@/lib/types";
import { spotifyUriToUrl } from "@/lib/utils";

const DEFAULT_ARTIST_ID = "5rBFU1rhgs1nNghopuj9k8"; // ((( 0 )))

async function getAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!(clientId && clientSecret)) {
    throw new Error(
      "Spotify credentials not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables."
    );
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to get Spotify token");
  }

  const data = await response.json();
  return data.access_token;
}

export async function getSpotifyArtist(
  artistId = DEFAULT_ARTIST_ID
): Promise<SpotifyArtist | null> {
  try {
    const token = await getAccessToken();

    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 86_400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch artist data");
    }

    const data = await response.json();

    return {
      id: data.id,
      name: data.name,
      followers: data.followers.total,
      image: data.images[0]?.url || "",
      genres: data.genres,
    };
  } catch (error) {
    console.error("Spotify artist error:", error);
    return null;
  }
}

export async function getSpotifyAlbums(
  artistId = DEFAULT_ARTIST_ID
): Promise<SpotifyAlbum[]> {
  try {
    const token = await getAccessToken();

    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,compilation&market=US&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 86_400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch albums");
    }

    const data = await response.json();

    return data.items.map(
      (album: {
        id: string;
        name: string;
        images: Array<{ url: string }>;
        release_date: string;
        uri: string;
      }) => ({
        id: album.id,
        name: album.name,
        image: album.images[0]?.url || "",
        releaseDate: album.release_date.substring(0, 4), // Just the year
        uri: album.uri,
        spotifyUrl: spotifyUriToUrl(album.uri),
      })
    );
  } catch (error) {
    console.error("Spotify albums error:", error);
    return [];
  }
}
