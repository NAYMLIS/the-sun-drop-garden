import type { StyleSpecification } from "maplibre-gl";

// Dark style matching the app's theme using OpenFreeMap tiles (OpenMapTiles schema)
export const tourMapStyle: StyleSpecification = {
  version: 8,
  name: "Dark Theme",
  sources: {
    openmaptiles: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
      attribution:
        '© <a href="https://openfreemap.org">OpenFreeMap</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>',
    },
  },
  sprite: "https://openmaptiles.github.io/osm-bright-gl-style/sprite",
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#1a1814",
      },
    },
    {
      id: "landcover_grass",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landcover",
      filter: ["==", "class", "grass"],
      paint: {
        "fill-color": "#1f2a1d",
        "fill-opacity": 0.4,
      },
    },
    {
      id: "landcover_wood",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landcover",
      filter: ["==", "class", "wood"],
      paint: {
        "fill-color": "#1a2518",
        "fill-opacity": 0.4,
      },
    },
    {
      id: "landuse_park",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      filter: ["in", "class", "park", "cemetery"],
      paint: {
        "fill-color": "#1f2a1d",
        "fill-opacity": 0.3,
      },
    },
    {
      id: "water",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "water",
      paint: {
        "fill-color": "#2f3e2b",
      },
    },
    {
      id: "waterway",
      type: "line",
      source: "openmaptiles",
      "source-layer": "waterway",
      paint: {
        "line-color": "#2f3e2b",
        "line-width": 1,
      },
    },
    {
      id: "boundary_country",
      type: "line",
      source: "openmaptiles",
      "source-layer": "boundary",
      filter: ["==", "admin_level", 2],
      paint: {
        "line-color": "#3d3a35",
        "line-width": 0.5,
      },
    },
    {
      id: "boundary_state",
      type: "line",
      source: "openmaptiles",
      "source-layer": "boundary",
      filter: ["==", "admin_level", 4],
      paint: {
        "line-color": "#2d2a25",
        "line-width": 0.3,
        "line-dasharray": [2, 2],
      },
    },
    {
      id: "roads_minor",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["in", "class", "minor", "service", "path"],
      paint: {
        "line-color": "#2a2620",
        "line-width": 0.5,
      },
      minzoom: 12,
    },
    {
      id: "roads_secondary",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["in", "class", "secondary", "tertiary"],
      paint: {
        "line-color": "#3a352d",
        "line-width": 1,
      },
      minzoom: 8,
    },
    {
      id: "roads_primary",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["==", "class", "primary"],
      paint: {
        "line-color": "#4a453a",
        "line-width": 1.5,
      },
      minzoom: 6,
    },
    {
      id: "roads_highway",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["in", "class", "motorway", "trunk"],
      paint: {
        "line-color": "#5a5545",
        "line-width": 2,
      },
      minzoom: 4,
    },
    {
      id: "places_suburb",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["==", "class", "suburb"],
      layout: {
        "text-field": "{name}",
        "text-font": ["Open Sans Regular"],
        "text-size": 10,
      },
      paint: {
        "text-color": "#5a564e",
        "text-halo-color": "#1a1814",
        "text-halo-width": 1,
      },
      minzoom: 13,
    },
    {
      id: "places_city",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["in", "class", "city", "town"],
      layout: {
        "text-field": "{name}",
        "text-font": ["Open Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 3, 8, 10, 14],
      },
      paint: {
        "text-color": "#7a756a",
        "text-halo-color": "#1a1814",
        "text-halo-width": 1.5,
      },
      minzoom: 4,
    },
    {
      id: "places_state",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["==", "class", "state"],
      layout: {
        "text-field": "{name}",
        "text-font": ["Open Sans Regular"],
        "text-size": 11,
        "text-transform": "uppercase",
        "text-letter-spacing": 0.1,
      },
      paint: {
        "text-color": "#5a564e",
        "text-halo-color": "#1a1814",
        "text-halo-width": 1,
      },
      minzoom: 4,
      maxzoom: 7,
    },
    {
      id: "places_country",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["==", "class", "country"],
      layout: {
        "text-field": "{name}",
        "text-font": ["Open Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 2, 10, 6, 14],
        "text-transform": "uppercase",
        "text-letter-spacing": 0.15,
      },
      paint: {
        "text-color": "#8a857a",
        "text-halo-color": "#1a1814",
        "text-halo-width": 2,
      },
      minzoom: 1,
      maxzoom: 6,
    },
  ],
  sky: {
    "sky-color": "#1a1814",
    "horizon-color": "#2f3e2b",
    "sky-horizon-blend": 0.5,
    "atmosphere-blend": 0.8,
  },
};

// Category colors for attraction markers
export const categoryColors: Record<string, string> = {
  environmental: "#22c55e",
  vendors: "#f97316",
  venues: "#a855f7",
  services: "#3b82f6",
  education: "#1e3a8a",
  art: "#db2777",
  wellness: "#ec4899",
  miscellaneous: "#6b7280",
  accommodation: "#ca8a04",
};

export function getCategoryColor(category: string): string {
  return categoryColors[category] || "#6b7280";
}
