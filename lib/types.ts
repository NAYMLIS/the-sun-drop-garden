export interface TourDate {
  _id: string;
  city: string;
  venue: string;
  date: string;
  lat: number;
  lng: number;
  ticketLink: string;
  description?: string;
  address?: string;
  time?: string;
}

export type AttractionCategory =
  | "environmental"
  | "vendors"
  | "venues"
  | "services"
  | "education"
  | "art"
  | "wellness"
  | "miscellaneous"
  | "accommodation";

export type AttractionLayer =
  | "food"
  | "groceries"
  | "regeneration"
  | "wellness"
  | "stay"
  | "awareness"
  | "booking";

export const ATTRACTION_LAYERS: AttractionLayer[] = [
  "food",
  "groceries",
  "regeneration",
  "wellness",
  "stay",
  "awareness",
  "booking",
];

export interface Attraction {
  _id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  category: AttractionCategory;
  city: string;
  description?: string;
  layer?: AttractionLayer;
  tags?: string[];
  publicMap?: boolean;
  addedBy?: string;
  addedAt?: number;
  notes?: string;
}

export interface SavedList {
  _id: string;
  ownerEmail: string;
  name: string;
  layer?: string;
  color?: string;
  icon?: string;
  createdAt: number;
  updatedAt: number;
  count?: number;
}

export interface CuratorMe {
  email: string;
  displayName?: string;
}

export type ViewState =
  | "HOME"
  | "TOUR"
  | "LIGHT"
  | "SOUND"
  | "CONNECT"
  | "ADMIN";

export interface SpotifyArtist {
  name: string;
  followers: number;
  image: string;
  genres: string[];
  id: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  image: string;
  releaseDate: string;
  uri: string;
  spotifyUrl: string;
}

export interface TourInfo {
  description: string;
  lat: number;
  lng: number;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  subscriberCount: number;
  thumbnail: string;
  customUrl: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: number;
  url: string;
}
