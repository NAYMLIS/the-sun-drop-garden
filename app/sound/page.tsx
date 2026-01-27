import { getSpotifyAlbums, getSpotifyArtist } from "@/lib/spotify";
import { SoundContent } from "./sound-content";

export default async function SoundPage() {
  const [artist, albums] = await Promise.all([
    getSpotifyArtist(),
    getSpotifyAlbums(),
  ]);

  return <SoundContent albums={albums} artist={artist} />;
}
