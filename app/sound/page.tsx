"use client";

import { ChevronDown, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/navigation";
import type { SpotifyAlbum, SpotifyArtist } from "@/lib/types";

export default function SoundPage() {
  const [artist, setArtist] = useState<SpotifyArtist | null>(null);
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSoundData = async () => {
      setIsLoading(true);
      try {
        const artistResponse = await fetch("/api/spotify/artist");
        const albumsResponse = await fetch("/api/spotify/albums");

        if (!(artistResponse.ok && albumsResponse.ok)) {
          throw new Error("Failed to fetch Spotify data");
        }

        const artistData = await artistResponse.json();
        const albumsData = await albumsResponse.json();

        setArtist(artistData);
        setAlbums(albumsData);
      } catch (error) {
        console.error("Failed to load sound data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSoundData();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="min-h-screen overflow-y-auto px-4 pt-24 pb-12">
        {isLoading ? (
          <div className="flex h-[50vh] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="mx-auto max-w-6xl">
            {/* Artist Header */}
            {artist && (
              <div className="mb-16 flex flex-col items-center gap-8 rounded-xl border border-primary/10 bg-foreground/5 p-8 md:flex-row">
                {artist.image && (
                  <div className="group relative">
                    <Image
                      alt={artist.name}
                      className="h-48 w-48 rounded object-cover shadow-2xl grayscale transition-all duration-500 group-hover:grayscale-0"
                      height={192}
                      src={artist.image}
                      width={192}
                    />
                    <div className="absolute inset-0 rounded border border-primary/30" />
                  </div>
                )}
                <div className="text-center md:text-left">
                  <h2 className="mb-2 font-serif text-4xl text-foreground md:text-6xl">
                    {artist.name}
                  </h2>
                  {artist.followers != null && (
                    <p className="mb-4 text-primary text-xs uppercase tracking-widest">
                      {artist.followers.toLocaleString()} Followers
                    </p>
                  )}
                  {artist.genres && artist.genres.length > 0 && (
                    <div className="flex justify-center gap-2 md:justify-start">
                      {artist.genres.map((genre) => (
                        <span
                          className="rounded-full border border-foreground/20 px-2 py-1 text-[10px] text-foreground/60 uppercase"
                          key={genre}
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="md:ml-auto">
                  <ChevronDown className="animate-bounce text-foreground/20" />
                </div>
              </div>
            )}

            {/* Albums Grid */}
            <h3 className="mb-6 border-foreground/10 border-b pb-2 text-foreground/50 text-xl uppercase tracking-widest">
              Albums
            </h3>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((album) => (
                <a
                  className="group cursor-pointer"
                  href={album.spotifyUrl}
                  key={album.id}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-foreground/5">
                    <Image
                      alt={album.name}
                      className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-100"
                      height={300}
                      src={album.image}
                      width={300}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Play
                        className="fill-current text-foreground"
                        size={48}
                      />
                    </div>
                  </div>
                  <h4 className="mb-1 font-serif text-foreground text-xl">
                    {album.name}
                  </h4>
                  <p className="text-foreground/40 text-xs uppercase tracking-wider">
                    {album.releaseDate} • Album
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
