"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Compass,
  MapPin,
  Maximize2,
  Minimize2,
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
  navigateToAttraction: (attraction: Attraction) => void;
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
      isFullScreen,
      navigateToCity,
      navigateToAttraction,
      navigateToPrevious,
      navigateToNext,
      setSelectedAttraction,
      setShowAttractionTags,
      zoomToShowAttractions,
      toggleFullScreen,
      resetToGlobalView,
    } = useTourMap({ dates, attractions });

    useImperativeHandle(ref, () => ({ navigateToCity, navigateToAttraction }), [
      navigateToCity,
      navigateToAttraction,
    ]);

    const cityAttractions = selectedCity
      ? attractions.filter((a) => a.city === selectedCity.city)
      : [];

    const uniqueCategories = [
      ...new Set(cityAttractions.map((a) => a.category)),
    ];

    return (
      <div
        className={`group relative flex items-center justify-center overflow-hidden ${
          isFullScreen
            ? "!fixed inset-0 z-[9999] h-screen w-screen bg-background"
            : "h-full min-h-[400px] w-full rounded-lg border border-primary/10 bg-background/30 md:min-h-[400px]"
        }`}
        ref={containerRef}
      >
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-foreground/40 uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100">
          Drag, Scroll, Click
        </div>

        {/* Control Buttons - Top Right */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-background/95 text-foreground/70 backdrop-blur-md transition-all hover:bg-foreground/10 hover:text-foreground"
            onClick={toggleFullScreen}
            title={isFullScreen ? "Exit full screen" : "Enter full screen"}
            type="button"
          >
            {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-background/95 text-foreground/70 backdrop-blur-md transition-all hover:bg-foreground/10 hover:text-foreground"
            onClick={resetToGlobalView}
            title="Reset to global view"
            type="button"
          >
            <Compass size={16} />
          </button>
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

        {/* Fullscreen Tour Dates Bar */}
        {isFullScreen && (
          <div className="absolute right-0 bottom-0 left-0 z-20 border-primary/10 border-t bg-background/95 backdrop-blur-md">
            <div className="scrollbar-hide flex snap-x snap-mandatory flex-row gap-4 overflow-x-auto px-4 py-4">
              {sortedDates.map((d: TourDate) => (
                <button
                  className={`group flex h-24 w-64 flex-shrink-0 cursor-pointer snap-center flex-col justify-between rounded-lg border p-3 text-left transition-all ${
                    selectedCity?._id === d._id
                      ? "border-primary/50 bg-foreground/10"
                      : "border-transparent bg-foreground/5 hover:border-primary/30 hover:bg-foreground/10"
                  }`}
                  key={d._id}
                  onClick={() => {
                    navigateToCity(d);
                  }}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="mb-0.5 block font-sans text-foreground text-xs uppercase tracking-widest">
                        {new Date(d.date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                        })}
                        {d.time && (
                          <span className="ml-2 font-mono normal-case">
                            {d.time}
                          </span>
                        )}
                      </span>
                      <h3 className="font-serif text-base text-foreground leading-tight">
                        {d.city}
                      </h3>
                      <p className="line-clamp-1 font-sans text-foreground/60 text-xs">
                        {d.venue}
                      </p>
                    </div>
                    <a
                      className="flex-shrink-0 rounded-full bg-primary px-2.5 py-1 font-bold text-[10px] text-primary-foreground uppercase tracking-wider opacity-0 transition-opacity group-hover:opacity-100"
                      href={d.ticketLink}
                      onClick={(e) => e.stopPropagation()}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Obtain Tickets
                    </a>
                  </div>
                  {d.description && (
                    <p className="line-clamp-1 border-primary/20 border-l pl-2 font-serif text-[10px] text-foreground/40 italic">
                      "{d.description}"
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected City Popup */}
        {selectedCity && !selectedAttraction && (
          <div className="absolute right-4 bottom-4 left-4 z-20 animate-fade-in-up rounded-lg border border-primary/30 bg-background/95 p-3 shadow-2xl backdrop-blur-md">
            <div className="pr-2 pl-2">
              <div className="mb-2 flex items-center gap-2">
                {/* Left Navigation Arrow */}
                {sortedDates.length > 1 && (
                  <button
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-primary/30 bg-background/95 text-foreground/70 backdrop-blur-md transition-all hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                    disabled={currentIndex <= 0}
                    onClick={navigateToPrevious}
                    type="button"
                  >
                    <ChevronLeft size={16} />
                  </button>
                )}
                <div className="flex min-w-0 flex-1 flex-col items-start gap-1 md:flex-row md:items-center md:gap-3">
                  <h3 className="font-serif text-foreground text-xl">
                    {selectedCity.city}
                  </h3>
                  <p className="flex items-center gap-1 text-foreground/60 text-xs uppercase tracking-widest">
                    <MapPin size={10} /> {selectedCity.venue}
                  </p>
                </div>
                {/* Right Navigation Arrow */}
                {sortedDates.length > 1 && (
                  <button
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-primary/30 bg-background/95 text-foreground/70 backdrop-blur-md transition-all hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                    disabled={currentIndex >= sortedDates.length - 1}
                    onClick={navigateToNext}
                    type="button"
                  >
                    <ChevronRight size={16} />
                  </button>
                )}
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
                  className="flex-shrink-0 rounded-full bg-primary px-2.5 py-1 font-bold text-[10px] text-primary-foreground uppercase tracking-wider opacity-100 transition-opacity"
                  href={selectedCity.ticketLink}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Obtain Tickets
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
