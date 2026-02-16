"use client";

import { useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import { TourMap, type TourMapRef } from "@/components/tour-map";
import { mapFullScreenAtom } from "@/lib/atoms";
import type { Attraction, TourDate } from "@/lib/types";

interface EmbedMapContentProps {
  dates: TourDate[];
  attractions: Attraction[];
  initialCity?: string;
}

export function EmbedMapContent({
  dates,
  attractions,
  initialCity,
}: EmbedMapContentProps) {
  const setFullScreen = useSetAtom(mapFullScreenAtom);
  const mapRef = useRef<TourMapRef>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    setFullScreen(true);
    return () => setFullScreen(false);
  }, [setFullScreen]);

  useEffect(() => {
    if (initialCity && !hasNavigated.current && mapRef.current) {
      const match = dates.find(
        (d) => d.city.toLowerCase() === initialCity.toLowerCase()
      );
      if (match) {
        hasNavigated.current = true;
        setTimeout(() => {
          mapRef.current?.navigateToCity(match);
        }, 1000);
      }
    }
  }, [initialCity, dates]);

  return (
    <div className="fixed inset-0 z-[9999] h-screen w-screen bg-background">
      <TourMap attractions={attractions} dates={dates} ref={mapRef} />
    </div>
  );
}
