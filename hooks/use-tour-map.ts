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
  const isAnimatingRef = useRef(false);

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
    if (!mapRef.current || isAnimatingRef.current) {
      return;
    }

    isAnimatingRef.current = true;
    setSelectedCity(city);
    setSelectedAttraction(null);
    setShowAttractionTags(false);

    mapRef.current.flyTo({
      center: [city.lng, city.lat],
      zoom: 6,
      duration: 1500,
      essential: true,
    });

    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 1600);
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

  const zoomToShowAttractions = () => {
    if (!(mapRef.current && selectedCity)) {
      return;
    }

    mapRef.current.flyTo({
      center: [selectedCity.lng, selectedCity.lat],
      zoom: 8,
      duration: 800,
    });
  };

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => {
      const newValue = !prev;
      // Resize map after DOM updates with new fullscreen state
      setTimeout(() => {
        mapRef.current?.resize();
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
      zoom: 1.5,
      duration: 1000,
    });
  };

  // Store navigateToCity in a ref for event handlers
  const navigateToCityRef = useRef(navigateToCity);
  navigateToCityRef.current = navigateToCity;

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
      zoom: 1.5,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

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

    // Track zoom level for attractions visibility
    map.on("zoomend", () => {
      const shouldShow = map.getZoom() >= 4;
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

        map.flyTo({
          center: centerRef.current,
          zoom: 1.5,
          duration: 1000,
        });
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

  // Update attraction markers when visibility or city changes
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
      const attractionsToShow = selectedCity
        ? attractions.filter((a) => a.city === selectedCity.city)
        : attractions;

      for (const attraction of attractionsToShow) {
        const el = createAttractionMarkerElement(attraction, false);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          setSelectedAttraction(attraction);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([attraction.lng, attraction.lat])
          .addTo(map);

        attractionMarkersRef.current.push(marker);
      }
    }
  }, [attractionsVisible, selectedCity, attractions]);

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
