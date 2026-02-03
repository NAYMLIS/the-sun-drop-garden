"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TourMap, type TourMapRef } from "@/components/tour-map";
import { getCategoryColor } from "@/lib/tour-map-style";
import type { Attraction, TourDate } from "@/lib/types";

interface TourContentProps {
  dates: TourDate[];
  attractions: Attraction[];
}

export function TourContent({ dates, attractions }: TourContentProps) {
  const mapRef = useRef<TourMapRef>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInside = Object.values(dropdownRefs.current).some((ref) =>
        ref?.contains(target)
      );
      if (!isClickInside) {
        setOpenDropdownId(null);
      }
    };

    if (openDropdownId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [openDropdownId]);

  // Scroll card into view when dropdown opens on mobile
  useEffect(() => {
    if (openDropdownId) {
      const cardElement = dropdownRefs.current[openDropdownId];
      if (cardElement) {
        // Small delay to ensure dropdown is rendered
        setTimeout(() => {
          cardElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }, 100);
      }
    }
  }, [openDropdownId]);

  return (
    <div className="flex flex-1 flex-col gap-8 md:flex-row">
      {/* List View */}
      <div
        className={`scrollbar-hide flex snap-x snap-mandatory flex-row gap-4 overflow-x-auto pr-4 pb-4 md:max-h-[calc(100vh-12rem)] md:w-1/3 md:flex-col md:space-y-4 md:overflow-y-auto ${
          openDropdownId ? "pb-80 md:pb-4" : ""
        }`}
      >
        {dates.map((d: TourDate) => {
          const cityAttractions = attractions.filter((a) => a.city === d.city);
          const isDropdownOpen = openDropdownId === d._id;

          return (
            <div
              className="relative"
              key={d._id}
              ref={(el) => {
                dropdownRefs.current[d._id] = el;
              }}
            >
              <button
                className="group flex h-32 w-[85vw] flex-shrink-0 cursor-pointer snap-center flex-col justify-between rounded-lg border border-transparent bg-foreground/5 p-3 text-left transition-all hover:border-primary/30 hover:bg-foreground/10 md:h-28 md:w-full"
                onClick={() => {
                  mapRef.current?.navigateToCity(d);
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
                    <h3 className="font-serif text-foreground text-lg leading-tight">
                      {d.city}
                    </h3>
                    <p className="line-clamp-1 font-sans text-foreground/60 text-xs">
                      {d.venue}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <a
                      className="flex-shrink-0 rounded-full bg-primary px-2.5 py-1 font-bold text-[10px] text-primary-foreground uppercase tracking-wider opacity-0 transition-opacity group-hover:opacity-100"
                      href={d.ticketLink}
                      onClick={(e) => e.stopPropagation()}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Tickets
                    </a>
                  </div>
                </div>
                {d.description && (
                  <p className="line-clamp-1 border-primary/20 border-l pl-2 font-serif text-[10px] text-foreground/40 italic">
                    "{d.description}"
                  </p>
                )}
                {cityAttractions.length > 0 && (
                  <button
                    className="mt-2 flex w-full items-center justify-between rounded-full bg-foreground/10 px-2.5 py-1 font-bold text-[10px] text-foreground uppercase tracking-wider transition-opacity hover:bg-foreground/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(isDropdownOpen ? null : d._id);
                    }}
                    type="button"
                  >
                    <span>Community</span>
                    <ChevronDown
                      className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                      size={12}
                    />
                  </button>
                )}
              </button>
              {isDropdownOpen && cityAttractions.length > 0 && (
                <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-64 w-[85vw] overflow-y-auto rounded-lg border border-primary/30 bg-background/95 shadow-2xl backdrop-blur-md md:w-full">
                  <div className="p-2">
                    {cityAttractions.map((attraction) => (
                      <button
                        className="group/attraction flex w-full items-start gap-2 rounded p-2 text-left transition-colors hover:bg-foreground/10"
                        key={attraction._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          mapRef.current?.navigateToCity(d);
                          setTimeout(() => {
                            mapRef.current?.navigateToAttraction(attraction);
                          }, 600);
                          setOpenDropdownId(null);
                        }}
                        type="button"
                      >
                        <div
                          className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
                          style={{
                            backgroundColor: getCategoryColor(
                              attraction.category
                            ),
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-serif text-foreground text-sm leading-tight">
                            {attraction.name}
                          </h4>
                          <p className="line-clamp-1 font-sans text-foreground/60 text-xs">
                            {attraction.address || attraction.city}
                          </p>
                          <span
                            className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"
                            style={{
                              backgroundColor: `${getCategoryColor(attraction.category)}20`,
                              color: getCategoryColor(attraction.category),
                            }}
                          >
                            {attraction.category}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Map View */}
      <div className="min-h-[600px] w-full pb-6 md:h-[calc(100vh-12rem)] md:w-2/3">
        <TourMap attractions={attractions} dates={dates} ref={mapRef} />
      </div>
    </div>
  );
}
