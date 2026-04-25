"use client";

import { useAtom } from "jotai";
import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { mapFullScreenAtom } from "@/lib/atoms";
import { getCategoryColor, tourMapStyle } from "@/lib/tour-map-style";
import type { Attraction, TourDate } from "@/lib/types";

interface UseTourMapOptions {
  dates: TourDate[];
  attractions: Attraction[];
}

interface UseTourMapReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  selectedCity: TourDate | null;
  selectedAttraction: Attraction | null;
  showAttractionTags: boolean;
  attractionsVisible: boolean;
  sortedDates: TourDate[];
  currentIndex: number;
  isFullScreen: boolean;
  navigateToCity: (city: TourDate) => void;
  navigateToAttraction: (attraction: Attraction) => void;
  navigateToPrevious: () => void;
  navigateToNext: () => void;
  setSelectedCity: (city: TourDate | null) => void;
  setSelectedAttraction: (attraction: Attraction | null) => void;
  setShowAttractionTags: (show: boolean) => void;
  zoomToShowAttractions: () => void;
  toggleFullScreen: () => void;
  resetToGlobalView: () => void;
}

function createTourMarkerElement(
  city: TourDate,
  isSelected: boolean
): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "tour-marker";
  el.style.cssText = `
    width: ${isSelected ? "24px" : "16px"};
    height: ${isSelected ? "24px" : "16px"};
    background: radial-gradient(circle, #d4af37 40%, rgba(212, 175, 55, 0.4) 100%);
    border: 2px solid #d4af37;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 ${isSelected ? "20px" : "10px"} rgba(212, 175, 55, 0.6);
  `;
  el.dataset.cityId = city._id;
  return el;
}

function createAttractionMarkerElement(
  attraction: Attraction,
  isSelected: boolean
): HTMLDivElement {
  const color = getCategoryColor(attraction.category);
  const el = document.createElement("div");
  el.className = "attraction-marker";
  el.style.cssText = `
    width: ${isSelected ? "16px" : "10px"};
    height: ${isSelected ? "16px" : "10px"};
    background: ${color};
    border: 2px solid ${color};
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 ${isSelected ? "12px" : "6px"} ${color}80;
  `;
  el.dataset.attractionId = attraction._id;
  return el;
}

function sortDates(dates: TourDate[]): TourDate[] {
  return [...dates].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

function calculateCenter(dates: TourDate[]): [number, number] {
  if (dates.length === 0) {
    return [-95, 40];
  }
  const avgLng = dates.reduce((sum, d) => sum + d.lng, 0) / dates.length;
  const avgLat = dates.reduce((sum, d) => sum + d.lat, 0) / dates.length;
  return [avgLng, avgLat];
}

export function useTourMap({
  dates,
  attractions,
}: UseTourMapOptions): UseTourMapReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const attractionMarkersRef = useRef<maplibregl.Marker[]>([]);
  const previousSelectedCityRef = useRef<TourDate | null>(null);

  const [selectedCity, setSelectedCity] = useState<TourDate | null>(null);
  const [selectedAttraction, setSelectedAttraction] =
    useState<Attraction | null>(null);
  const [showAttractionTags, setShowAttractionTags] = useState(false);
  const [attractionsVisible, setAttractionsVisible] = useState(false);
  const [isFullScreen, setIsFullScreen] = useAtom(mapFullScreenAtom);

  const sortedDates = sortDates(dates);
  const center = calculateCenter(sortedDates);

  // Store values in refs for use in map initialization (to avoid re-creating map)
  const sortedDatesRef = useRef(sortedDates);
  const centerRef = useRef(center);
  sortedDatesRef.current = sortedDates;
  centerRef.current = center;

  const currentIndex = selectedCity
    ? sortedDates.findIndex((d) => d._id === selectedCity._id)
    : -1;

  const navigateToCity = (city: TourDate) => {
    if (!mapRef.current) {
      return;
    }

    // Check if this is a second click on the same city
    const isSecondClick = previousSelectedCityRef.current?._id === city._id;
    previousSelectedCityRef.current = city;

    setSelectedCity(city);
    setSelectedAttraction(null);
    setShowAttractionTags(false);

    // First click: zoom to level 8, second click: zoom to level 10
    const targetZoom = isSecondClick ? 10 : 8;

    // Calculate offset for mobile: position point at 1/3 from top (2/3 up from bottom)
    // to avoid being covered by the bottom card
    const container = mapRef.current.getContainer();
    const isMobile = !isFullScreen && window.innerWidth < 768;
    const offset: [number, number] = isMobile
      ? [0, -container.clientHeight / 6]
      : [0, 0];

    // Stop any ongoing animation and immediately start new one
    mapRef.current.stop();
    mapRef.current.flyTo({
      center: [city.lng, city.lat],
      zoom: targetZoom,
      duration: 600,
      essential: true,
      offset,
    });
  };

  const navigateToPrevious = () => {
    if (currentIndex > 0) {
      navigateToCity(sortedDates[currentIndex - 1]);
    }
  };

  const navigateToNext = () => {
    if (currentIndex >= 0 && currentIndex < sortedDates.length - 1) {
      navigateToCity(sortedDates[currentIndex + 1]);
    }
  };

  const navigateToAttraction = (attraction: Attraction) => {
    if (!mapRef.current) {
      return;
    }

    setSelectedAttraction(attraction);

    const currentZoom = mapRef.current.getZoom();

    // Calculate offset for mobile: position point at 1/3 from top (2/3 up from bottom)
    // to avoid being covered by the bottom card
    const container = mapRef.current.getContainer();
    const isMobile = !isFullScreen && window.innerWidth < 768;
    const offset: [number, number] = isMobile
      ? [0, -container.clientHeight / 6]
      : [0, 0];

    // If already zoomed in (>= 13), just pan smoothly without changing zoom
    // Then zoom in to 15 if not already there
    if (currentZoom >= 13) {
      mapRef.current.stop();
      mapRef.current.flyTo({
        center: [attraction.lng, attraction.lat],
        zoom: currentZoom,
        duration: 400,
        essential: true,
        offset,
      });
      // Zoom in to close-up if not already at 15
      if (currentZoom < 15) {
        setTimeout(() => {
          if (mapRef.current) {
            const container = mapRef.current.getContainer();
            const isMobile = !isFullScreen && window.innerWidth < 768;
            const offset: [number, number] = isMobile
              ? [0, -container.clientHeight / 6]
              : [0, 0];
            mapRef.current.flyTo({
              center: [attraction.lng, attraction.lat],
              zoom: 15,
              duration: 300,
              essential: true,
              offset,
            });
          }
        }, 400);
      }
      return;
    }

    // If zoomed out, zoom in directly to close-up
    mapRef.current.stop();
    mapRef.current.flyTo({
      center: [attraction.lng, attraction.lat],
      zoom: 15,
      duration: 600,
      essential: true,
      offset,
    });
  };

  const zoomToShowAttractions = () => {
    if (!(mapRef.current && selectedCity)) {
      return;
    }

    const cityAttractions = attractions.filter(
      (a) => a.city === selectedCity.city
    );

    if (cityAttractions.length === 0) {
      return;
    }

    // Calculate bounding box from all attractions
    const lngs = cityAttractions.map((a) => a.lng);
    const lats = cityAttractions.map((a) => a.lat);

    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    // Use fitBounds to show all attractions with padding
    mapRef.current.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: 50,
        duration: 800,
        maxZoom: 15,
      }
    );

    // Ensure zoom is at least 7 after fitBounds completes
    setTimeout(() => {
      if (mapRef.current && mapRef.current.getZoom() < 7) {
        mapRef.current.zoomTo(7, { duration: 400 });
      }
    }, 850);
  };

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => {
      const newValue = !prev;
      // Resize map after DOM updates with new fullscreen state
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.resize();
          mapRef.current.setPadding({
            top: newValue ? 60 : 0,
            bottom: newValue ? 150 : 0,
            left: 0,
            right: 0,
          });
        }
      }, 0);
      return newValue;
    });
  };

  const resetToGlobalView = () => {
    if (!mapRef.current) {
      return;
    }

    setSelectedCity(null);
    setSelectedAttraction(null);
    setShowAttractionTags(false);

    mapRef.current.flyTo({
      center: centerRef.current,
      zoom: 1.2,
      duration: 1000,
    });
  };

  // Store navigateToCity in a ref for event handlers
  const navigateToCityRef = useRef(navigateToCity);
  navigateToCityRef.current = navigateToCity;

  // Store navigateToAttraction in a ref for event handlers
  const navigateToAttractionRef = useRef(navigateToAttraction);
  navigateToAttractionRef.current = navigateToAttraction;

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const initialCenter = centerRef.current;
    const initialDates = sortedDatesRef.current;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: tourMapStyle,
      center: initialCenter,
      zoom: 1.2,
      attributionControl: false,
      doubleClickZoom: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      map.setProjection({ type: "globe" });

      // Add tour route line
      if (initialDates.length > 1) {
        map.addSource("tour-route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: initialDates.map((d) => [d.lng, d.lat]),
            },
          },
        });

        map.addLayer({
          id: "tour-route-line",
          type: "line",
          source: "tour-route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#d4af37",
            "line-width": 2,
            "line-opacity": 0.8,
            "line-dasharray": [2, 2],
          },
        });
      }

      // Add city markers
      for (const city of initialDates) {
        const el = createTourMarkerElement(city, false);
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          navigateToCityRef.current(city);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([city.lng, city.lat])
          .addTo(map);

        markersRef.current.push(marker);
      }
    });

    // Attractions appear once the user zooms past the global view, so the
    // initial globe stays clean (only tour-stop markers visible). Threshold
    // is zoom 5 — roughly continent-level — so spots fade in as you explore.
    map.on("zoomend", () => {
      const shouldShow = map.getZoom() >= 5;
      setAttractionsVisible((prev) =>
        prev !== shouldShow ? shouldShow : prev
      );
    });

    // Click on empty space to deselect
    map.on("click", (e) => {
      const target = e.originalEvent.target as HTMLElement;
      if (
        !(
          target.classList.contains("tour-marker") ||
          target.classList.contains("attraction-marker")
        )
      ) {
        setSelectedCity(null);
        setSelectedAttraction(null);
        setShowAttractionTags(false);
        previousSelectedCityRef.current = null;
      }
    });

    return () => {
      for (const marker of markersRef.current) {
        marker.remove();
      }
      for (const marker of attractionMarkersRef.current) {
        marker.remove();
      }
      markersRef.current = [];
      attractionMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update city marker styles when selection changes
  useEffect(() => {
    for (const marker of markersRef.current) {
      const el = marker.getElement();
      const cityId = el.dataset.cityId;
      const isSelected = selectedCity?._id === cityId;

      el.style.width = isSelected ? "24px" : "16px";
      el.style.height = isSelected ? "24px" : "16px";
      el.style.boxShadow = `0 0 ${isSelected ? "20px" : "10px"} rgba(212, 175, 55, 0.6)`;
    }
  }, [selectedCity]);

  // Update attraction markers whenever the zoom-gated visibility flips
  // or the underlying attractions list changes.
  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const map = mapRef.current;

    // Remove existing attraction markers
    for (const marker of attractionMarkersRef.current) {
      marker.remove();
    }
    attractionMarkersRef.current = [];

    if (attractionsVisible) {
      // Show every regenerative spot in the world once the user has zoomed
      // in past the globe view. No city filter — Kyle wants the full atlas
      // visible whenever pins are on, not just spots near tour cities.
      const attractionsToShow = attractions;

      for (const attraction of attractionsToShow) {
        const el = createAttractionMarkerElement(attraction, false);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          navigateToAttractionRef.current(attraction);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([attraction.lng, attraction.lat])
          .addTo(map);

        attractionMarkersRef.current.push(marker);
      }
    }
  }, [attractionsVisible, attractions]);

  return {
    containerRef,
    selectedCity,
    selectedAttraction,
    showAttractionTags,
    attractionsVisible,
    sortedDates,
    currentIndex,
    isFullScreen,
    navigateToCity,
    navigateToAttraction,
    navigateToPrevious,
    navigateToNext,
    setSelectedCity,
    setSelectedAttraction,
    setShowAttractionTags,
    zoomToShowAttractions,
    toggleFullScreen,
    resetToGlobalView,
  };
}
