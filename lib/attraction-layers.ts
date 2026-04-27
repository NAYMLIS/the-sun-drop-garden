import type { AttractionLayer } from "@/lib/types";

export interface LayerMeta {
  id: AttractionLayer;
  label: string;
  emoji: string;
  color: string; // hex
  description: string;
  suggestedTags: string[];
}

export const LAYER_META: Record<AttractionLayer, LayerMeta> = {
  food: {
    id: "food",
    label: "Food",
    emoji: "🥗",
    color: "#84cc16", // lime
    description: "Vegan / vegetarian restaurants & cafés",
    suggestedTags: [
      "vegan",
      "vegetarian",
      "restaurant",
      "cafe",
      "bakery",
      "juice-bar",
    ],
  },
  groceries: {
    id: "groceries",
    label: "Groceries",
    emoji: "🛒",
    color: "#f59e0b", // amber
    description: "Bulk buying, farmers markets, co-ops",
    suggestedTags: ["bulk", "farmers-market", "co-op", "grocery", "specialty"],
  },
  regeneration: {
    id: "regeneration",
    label: "Regeneration",
    emoji: "🌱",
    color: "#22c55e", // green
    description:
      "Native plants, organic farms, gardens, compost, seed libraries, pottery",
    suggestedTags: [
      "native-plants",
      "organic-farm",
      "community-garden",
      "compost",
      "seed-library",
      "pottery",
      "permaculture",
      "nursery",
    ],
  },
  wellness: {
    id: "wellness",
    label: "Wellness",
    emoji: "🧘",
    color: "#06b6d4", // cyan
    description: "Bike shops, yoga, bath houses, cold plunge, gyms",
    suggestedTags: [
      "yoga",
      "bath-house",
      "cold-plunge",
      "gym",
      "bike-shop",
      "spa",
      "sauna",
    ],
  },
  stay: {
    id: "stay",
    label: "Stay",
    emoji: "🏡",
    color: "#a855f7", // purple
    description: "Green stays, farm stays, retreat lodging",
    suggestedTags: ["green-stay", "farm-stay", "retreat", "eco-lodge"],
  },
  awareness: {
    id: "awareness",
    label: "Awareness",
    emoji: "🎨",
    color: "#ec4899", // pink
    description: "Galleries, museums, libraries, cultural spaces",
    suggestedTags: ["gallery", "museum", "library", "cultural", "education"],
  },
  booking: {
    id: "booking",
    label: "Booking",
    emoji: "🎤",
    color: "#fb7185", // rose
    description: "Tour venues & confirmed booking spots",
    suggestedTags: ["venue", "promoted-spot"],
  },
};

export const LAYER_ORDER: AttractionLayer[] = [
  "food",
  "groceries",
  "regeneration",
  "wellness",
  "stay",
  "awareness",
  "booking",
];

export function getLayerColor(layer?: string): string {
  if (!layer) {
    return "#9ca3af";
  }
  return LAYER_META[layer as AttractionLayer]?.color ?? "#9ca3af";
}

export function getLayerEmoji(layer?: string): string {
  if (!layer) {
    return "📍";
  }
  return LAYER_META[layer as AttractionLayer]?.emoji ?? "📍";
}

export function getLayerLabel(layer?: string): string {
  if (!layer) {
    return "Unsorted";
  }
  return LAYER_META[layer as AttractionLayer]?.label ?? layer;
}
