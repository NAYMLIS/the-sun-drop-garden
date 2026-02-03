"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  getBandcampEmbedUrl,
  getSoundCloudEmbedUrl,
  getSpotifyEmbedUrl,
  getVimeoEmbedUrl,
  getYouTubeEmbedUrl,
} from "@/lib/media-utils";

interface YouTubeEmbedProps {
  url: string;
}

export function YouTubeEmbed({ url }: YouTubeEmbedProps) {
  const embedUrl = getYouTubeEmbedUrl(url);
  if (!embedUrl) {
    return <GenericLink url={url} />;
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
        src={embedUrl}
        title="YouTube video player"
      />
    </div>
  );
}

interface SoundCloudEmbedProps {
  url: string;
}

export function SoundCloudEmbed({ url }: SoundCloudEmbedProps) {
  const embedUrl = getSoundCloudEmbedUrl(url);

  return (
    <div className="relative h-[166px] w-full overflow-hidden rounded-lg">
      <iframe
        allow="autoplay"
        className="absolute inset-0 h-full w-full"
        scrolling="no"
        src={embedUrl}
        title="SoundCloud player"
      />
    </div>
  );
}

interface BandcampEmbedProps {
  url: string;
}

export function BandcampEmbed({ url }: BandcampEmbedProps) {
  const embedUrl = getBandcampEmbedUrl(url);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-primary/20">
      <iframe
        allow="autoplay"
        className="h-[120px] w-full border-0"
        src={embedUrl}
        title="Bandcamp player"
      />
    </div>
  );
}

interface SpotifyEmbedProps {
  url: string;
}

export function SpotifyEmbed({ url }: SpotifyEmbedProps) {
  const embedUrl = getSpotifyEmbedUrl(url);
  if (!embedUrl) {
    return <GenericLink url={url} />;
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-primary/20 bg-background">
      <div className="relative h-[352px] w-full overflow-hidden">
        <iframe
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className="absolute inset-0 h-full w-full scale-[1.02] border-0"
          loading="lazy"
          src={embedUrl}
          style={{
            backgroundColor: "transparent",
          }}
          title="Spotify player"
        />
      </div>
    </div>
  );
}

interface VimeoEmbedProps {
  url: string;
}

export function VimeoEmbed({ url }: VimeoEmbedProps) {
  const embedUrl = getVimeoEmbedUrl(url);
  if (!embedUrl) {
    return <GenericLink url={url} />;
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
      <iframe
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
        src={embedUrl}
        title="Vimeo video player"
      />
    </div>
  );
}

interface GenericLinkProps {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
}

export function GenericLink({
  url,
  title,
  description,
  image,
  favicon,
}: GenericLinkProps) {
  let hostname = "";
  try {
    const urlObj = new URL(url);
    hostname = urlObj.hostname.replace("www.", "");
  } catch {
    // Invalid URL, use as-is
  }

  return (
    <a
      className="block overflow-hidden rounded-lg border border-primary/20 bg-foreground/5 transition-colors hover:bg-foreground/10"
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      {image && (
        <div className="relative aspect-video w-full overflow-hidden bg-foreground/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/* biome-ignore lint/performance/noImgElement: External URLs, dimensions unknown */}
          {/* biome-ignore lint/correctness/useImageSize: External image dimensions unknown */}
          <img
            alt={title || "Link preview"}
            className="h-full w-full object-contain"
            src={image}
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {favicon && (
            <div className="mt-0.5 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {/* biome-ignore lint/performance/noImgElement: External favicon, dimensions unknown */}
              {/* biome-ignore lint/correctness/useImageSize: Favicon dimensions unknown */}
              <img alt="" className="h-4 w-4 rounded" src={favicon} />
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            {title ? (
              <h3 className="line-clamp-2 font-semibold font-serif text-foreground text-sm leading-snug">
                {title}
              </h3>
            ) : (
              <div className="text-foreground/70 text-sm">{hostname}</div>
            )}
            {description && (
              <p className="line-clamp-2 text-foreground/60 text-xs leading-relaxed">
                {description}
              </p>
            )}
            {!description && hostname && title && (
              <p className="text-foreground/50 text-xs">{hostname}</p>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

interface MediaFileProps {
  fileId: Id<"_storage">;
  fileUrl?: string;
  mediaType: "image" | "audio" | "video";
}

export function MediaFile({ fileId, fileUrl, mediaType }: MediaFileProps) {
  // Fetch file URL from Convex if not provided
  const fetchedFileUrl = useQuery(
    api.posts.getFileUrl,
    fileId && !fileUrl ? { fileId } : "skip"
  );

  const url = fileUrl || fetchedFileUrl || null;

  if (!url) {
    return (
      <div className="w-full rounded-lg border border-primary/20 bg-foreground/5 p-4 text-center text-foreground/50 text-sm">
        Loading media...
      </div>
    );
  }

  if (mediaType === "image") {
    return (
      <div className="relative w-full overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* biome-ignore lint/performance/noImgElement: User-uploaded file, dimensions unknown */}
        {/* biome-ignore lint/correctness/useImageSize: User-uploaded image dimensions unknown */}
        <img alt="Post" className="h-auto w-full object-cover" src={url} />
      </div>
    );
  }

  if (mediaType === "audio") {
    return (
      <div className="w-full rounded-lg border border-primary/20 bg-foreground/5 p-4">
        {/* biome-ignore lint/a11y/useMediaCaption: User-uploaded audio, captions would need to be provided separately */}
        <audio className="w-full" controls src={url}>
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  if (mediaType === "video") {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg">
        {/* biome-ignore lint/a11y/useMediaCaption: User-uploaded video, captions would need to be provided separately */}
        <video className="h-full w-full object-cover" controls src={url}>
          Your browser does not support the video element.
        </video>
      </div>
    );
  }

  return null;
}

interface PostMediaProps {
  mediaType: "image" | "audio" | "video" | "link" | null;
  linkType?:
    | "youtube"
    | "soundcloud"
    | "bandcamp"
    | "vimeo"
    | "spotify"
    | "generic";
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  linkImage?: string;
  linkFavicon?: string;
  fileId?: Id<"_storage">;
  fileUrl?: string;
}

export function PostMedia({
  mediaType,
  linkType,
  linkUrl,
  linkTitle,
  linkDescription,
  linkImage,
  linkFavicon,
  fileId,
  fileUrl,
}: PostMediaProps) {
  if (mediaType === "link" && linkUrl) {
    switch (linkType) {
      case "youtube":
        return <YouTubeEmbed url={linkUrl} />;
      case "soundcloud":
        return <SoundCloudEmbed url={linkUrl} />;
      case "bandcamp":
        return <BandcampEmbed url={linkUrl} />;
      case "vimeo":
        return <VimeoEmbed url={linkUrl} />;
      case "spotify":
        return <SpotifyEmbed url={linkUrl} />;
      default:
        return (
          <GenericLink
            description={linkDescription}
            favicon={linkFavicon}
            image={linkImage}
            title={linkTitle}
            url={linkUrl}
          />
        );
    }
  }

  if (mediaType && mediaType !== "link" && fileId) {
    return (
      <MediaFile fileId={fileId} fileUrl={fileUrl} mediaType={mediaType} />
    );
  }

  return null;
}
