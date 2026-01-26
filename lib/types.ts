export interface TourDate {
  _id: string;
  city: string;
  venue: string;
  date: string;
  lat: number;
  lng: number;
  ticketLink: string;
  description?: string;
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
