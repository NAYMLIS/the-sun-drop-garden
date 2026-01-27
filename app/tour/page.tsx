"use client";

import { useQuery } from "convex/react";
import { useRef } from "react";
import { Navigation } from "@/components/navigation";
import { TourMap, type TourMapRef } from "@/components/tour-map";
import { api } from "@/convex/_generated/api";
import type { Attraction, AttractionCategory, TourDate } from "@/lib/types";

export default function TourPage() {
  const dates = useQuery(api.tourDates.list) || [];
  const rawAttractions = useQuery(api.attractions.list) || [];
  const attractions: Attraction[] = rawAttractions.map((attr) => ({
    ...attr,
    category: attr.category as AttractionCategory,
  }));
  const mapRef = useRef<TourMapRef>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="mx-auto flex h-[calc(100vh-2rem)] max-w-7xl animate-fade-in flex-col px-6 pt-32 md:px-12">
        <h2 className="mb-8 border-primary/20 border-b pb-4 font-serif text-4xl text-foreground">
          2026 North American Tour
        </h2>
        <div className="flex flex-1 flex-col gap-8 overflow-hidden pb-8 md:flex-row">
          {/* List View */}
          <div className="scrollbar-hide w-full space-y-4 overflow-y-auto pr-4 md:w-1/2">
            {dates.map((d: TourDate) => (
              <button
                className="group w-full cursor-pointer rounded-lg border border-transparent bg-foreground/5 p-6 text-left transition-all hover:border-primary/30 hover:bg-foreground/10"
                key={d._id}
                onClick={() => {
                  mapRef.current?.navigateToCity(d);
                }}
                type="button"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <span className="mb-1 block font-sans text-foreground text-xs uppercase tracking-widest">
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
                    <h3 className="font-serif text-2xl text-foreground">
                      {d.city}
                    </h3>
                    <p className="font-sans text-foreground/60 text-sm">
                      {d.venue}
                    </p>
                    {d.address && (
                      <p className="font-sans text-foreground/50 text-xs">
                        {d.address}
                      </p>
                    )}
                  </div>
                  <a
                    className="rounded-full bg-primary px-4 py-2 font-bold text-primary-foreground text-xs uppercase tracking-wider opacity-0 transition-opacity group-hover:opacity-100"
                    href={d.ticketLink}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Tickets
                  </a>
                </div>
                {d.description && (
                  <p className="mt-2 border-primary/20 border-l pl-3 font-serif text-foreground/40 text-sm italic">
                    "{d.description}"
                  </p>
                )}
              </button>
            ))}
          </div>
          {/* Map View */}
          <div className="min-h-[300px] w-full md:h-auto md:w-1/2">
            <TourMap attractions={attractions} dates={dates} ref={mapRef} />
          </div>
        </div>
      </main>
    </div>
  );
}
