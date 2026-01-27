"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { MusicPlatformLinks } from "@/components/music-platform-links";
import { Navigation } from "@/components/navigation";
import type { SpotifyAlbum, SpotifyArtist } from "@/lib/types";

interface SoundContentProps {
  artist: SpotifyArtist | null;
  albums: SpotifyAlbum[];
}

export function SoundContent({ artist, albums }: SoundContentProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="mx-auto max-w-7xl animate-fade-in px-6 pt-32 pb-12 md:px-12">
        {/* Music Platform Links */}
        <MusicPlatformLinks />

        {/* Artist Header */}
        {artist && (
          <div className="mb-16 flex flex-col items-center gap-6 md:flex-row md:items-start">
            {artist.image && (
              <div className="relative flex-shrink-0">
                <Image
                  alt={artist.name}
                  className="h-32 w-32 rounded-full object-cover"
                  height={128}
                  src={artist.image}
                  width={128}
                />
              </div>
            )}
            <div className="flex-1 text-center md:text-left">
              <h2 className="mb-2 font-serif text-4xl text-foreground md:text-5xl">
                {artist.name}
              </h2>
              {artist.followers != null && (
                <p className="mb-4 text-primary text-sm uppercase tracking-widest">
                  {artist.followers.toLocaleString()} followers
                </p>
              )}
              {artist.genres && artist.genres.length > 0 && (
                <div className="mb-4 flex flex-wrap justify-center gap-2 md:justify-start">
                  {artist.genres.slice(0, 3).map((genre) => (
                    <span
                      className="rounded-full border border-foreground/20 bg-foreground/5 px-3 py-1 text-foreground/70 text-xs uppercase tracking-wider"
                      key={genre}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              <a
                className="mt-4 inline-block text-primary text-sm underline transition-colors hover:text-primary/80"
                href="https://open.spotify.com/artist/5rBFU1rhgs1nNghopuj9k8?si=6OAQEqqtSAqT1xCGRIa_aw"
                rel="noopener noreferrer"
                target="_blank"
              >
                Visit Artist
              </a>
            </div>
          </div>
        )}

        {/* Albums Grid */}
        {albums.length > 0 && (
          <>
            <h3 className="mb-6 border-foreground/10 border-b pb-2 text-foreground/50 text-xl uppercase tracking-widest">
              Albums
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  <h4 className="mb-2 line-clamp-2 font-serif text-foreground text-lg">
                    {album.name}
                  </h4>
                  <div className="flex items-center gap-2 text-foreground/40 text-xs uppercase tracking-wider">
                    <span>{album.releaseDate}</span>
                    <span>-</span>
                    <span>Album</span>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {!artist && albums.length === 0 && (
          <div className="flex h-[50vh] flex-col items-center justify-center text-center">
            <p className="mb-4 text-foreground/60 text-lg">
              Spotify artist data unavailable
            </p>
            <p className="text-foreground/40 text-sm">
              Please configure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to
              display artist content
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
