"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  MapPin,
  Ticket,
  X,
} from "lucide-react";
import { forwardRef, useImperativeHandle } from "react";
import { useTourMap } from "@/hooks/use-tour-map";
import { getCategoryColor } from "@/lib/tour-map-style";
import type { Attraction, TourDate } from "@/lib/types";

interface TourMapProps {
  dates: TourDate[];
  attractions: Attraction[];
}

export interface TourMapRef {
  navigateToCity: (city: TourDate) => void;
}

export const TourMap = forwardRef<TourMapRef, TourMapProps>(
  ({ dates, attractions }, ref) => {
    const {
      containerRef,
      selectedCity,
      selectedAttraction,
      showAttractionTags,
      sortedDates,
      currentIndex,
      navigateToCity,
      navigateToPrevious,
      navigateToNext,
      setSelectedCity,
      setSelectedAttraction,
      setShowAttractionTags,
      zoomToShowAttractions,
    } = useTourMap({ dates, attractions });

    useImperativeHandle(ref, () => ({ navigateToCity }), [navigateToCity]);

    const cityAttractions = selectedCity
      ? attractions.filter((a) => a.city === selectedCity.city)
      : [];

    const uniqueCategories = [
      ...new Set(cityAttractions.map((a) => a.category)),
    ];

    return (
      <div
        className="group relative flex h-full min-h-[400px] w-full items-center justify-center overflow-hidden rounded-lg border border-primary/10 bg-background/30"
        ref={containerRef}
        style={{ minHeight: "400px" }}
      >
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-foreground/40 uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100">
          Drag, Scroll, Click
        </div>

        {/* Navigation Arrows */}
        {selectedCity && sortedDates.length > 1 && (
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-background/95 text-foreground/70 backdrop-blur-md transition-all hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              disabled={currentIndex <= 0}
              onClick={navigateToPrevious}
              type="button"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-background/95 text-foreground/70 backdrop-blur-md transition-all hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              disabled={currentIndex >= sortedDates.length - 1}
              onClick={navigateToNext}
              type="button"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Selected City Popup */}
        {selectedCity && !selectedAttraction && (
          <div className="absolute right-4 bottom-4 left-4 z-20 animate-fade-in-up rounded-lg border border-primary/30 bg-background/95 p-3 shadow-2xl backdrop-blur-md">
            <button
              className="absolute top-2 right-2 opacity-55 transition-colors hover:text-foreground"
              onClick={() => {
                setSelectedCity(null);
                setSelectedAttraction(null);
              }}
              type="button"
            >
              <X size={16} />
            </button>
            <div className="pr-6">
              <div className="mb-2 flex flex-col items-start gap-1 md:flex-row md:items-center md:gap-3">
                <h3 className="font-serif text-foreground text-xl">
                  {selectedCity.city}
                </h3>
                <p className="flex items-center gap-1 text-foreground/60 text-xs uppercase tracking-widest">
                  <MapPin size={10} /> {selectedCity.venue}
                </p>
              </div>
              {selectedCity.address && (
                <p className="mb-2 text-foreground/50 text-xs">
                  {selectedCity.address}
                </p>
              )}
              {selectedCity.description && (
                <p className="mb-2 font-serif text-foreground/80 text-sm italic leading-relaxed">
                  "{selectedCity.description}"
                </p>
              )}
              <div className="mt-1 flex items-center justify-between border-primary/10 border-t pt-2">
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1 font-mono text-foreground/70 text-xs">
                    <Calendar size={10} />
                    {new Date(selectedCity.date).toLocaleDateString()}
                  </span>
                  {selectedCity.time && (
                    <span className="font-mono text-foreground/60 text-xs">
                      {selectedCity.time}
                    </span>
                  )}
                </div>
                <a
                  className="flex items-center gap-1 rounded-full bg-foreground/10 px-3 py-1 font-bold text-foreground text-xs uppercase tracking-wider transition-colors hover:bg-foreground hover:text-background"
                  href={selectedCity.ticketLink}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Ticket size={10} /> Get Tickets
                </a>
              </div>
              {cityAttractions.length > 0 && (
                <div className="mt-2 border-primary/10 border-t pt-2">
                  <button
                    className="mb-2 flex w-full items-center justify-between text-foreground/40 text-xs italic transition-colors hover:text-foreground/60"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (showAttractionTags) {
                        setShowAttractionTags(false);
                      } else {
                        zoomToShowAttractions();
                        setTimeout(() => setShowAttractionTags(true), 100);
                      }
                    }}
                    type="button"
                  >
                    <span>
                      {cityAttractions.length} community destinations nearby
                    </span>
                    {showAttractionTags ? (
                      <ChevronUp className="text-foreground/40" size={14} />
                    ) : (
                      <ChevronDown className="text-foreground/40" size={14} />
                    )}
                  </button>
                  {showAttractionTags && (
                    <div className="flex flex-wrap gap-2">
                      {uniqueCategories.map((category) => (
                        <span
                          className="inline-block rounded-full px-2 py-1 text-xs uppercase tracking-wider"
                          key={category}
                          style={{
                            backgroundColor: `${getCategoryColor(category)}20`,
                            color: getCategoryColor(category),
                          }}
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Attraction Popup */}
        {selectedAttraction && (
          <div className="absolute right-4 bottom-4 left-4 z-20 animate-fade-in-up rounded-lg border border-primary/30 bg-background/95 p-3 shadow-2xl backdrop-blur-md">
            <button
              className="absolute top-2 right-2 opacity-55 transition-colors hover:text-foreground"
              onClick={() => setSelectedAttraction(null)}
              type="button"
            >
              <X size={16} />
            </button>
            <div className="pr-6">
              <h3 className="mb-1 font-serif text-foreground text-xl">
                {selectedAttraction.name}
              </h3>
              <p className="mb-2 flex items-center gap-1 text-foreground/60 text-xs uppercase tracking-widest">
                <MapPin size={10} /> {selectedAttraction.city}
              </p>
              {selectedAttraction.address && (
                <p className="mb-2 text-foreground/50 text-xs">
                  {selectedAttraction.address}
                </p>
              )}
              <span
                className="mb-2 inline-block rounded-full px-2 py-1 text-xs uppercase tracking-wider"
                style={{
                  backgroundColor: `${getCategoryColor(selectedAttraction.category)}20`,
                  color: getCategoryColor(selectedAttraction.category),
                }}
              >
                {selectedAttraction.category}
              </span>
              {selectedAttraction.description && (
                <p className="mt-2 font-serif text-foreground/80 text-sm italic leading-relaxed">
                  "{selectedAttraction.description}"
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

TourMap.displayName = "TourMap";
