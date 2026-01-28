"use client";

import { useRef } from "react";
import { TourMap, type TourMapRef } from "@/components/tour-map";
import type { Attraction, TourDate } from "@/lib/types";

interface TourContentProps {
  dates: TourDate[];
  attractions: Attraction[];
}

export function TourContent({ dates, attractions }: TourContentProps) {
  const mapRef = useRef<TourMapRef>(null);

  return (
    <div className="flex flex-1 flex-col gap-8 md:flex-row">
      {/* List View */}
      <div className="scrollbar-hide flex snap-x snap-mandatory flex-row gap-4 overflow-x-auto pr-4 pb-4 md:max-h-[calc(100vh-12rem)] md:w-2/3 md:flex-col md:space-y-4 md:overflow-y-auto">
        {dates.map((d: TourDate) => (
          <button
            className="group flex h-32 w-[85vw] flex-shrink-0 cursor-pointer snap-center flex-col justify-between rounded-lg border border-transparent bg-foreground/5 p-3 text-left transition-all hover:border-primary/30 hover:bg-foreground/10 md:h-28 md:w-full"
            key={d._id}
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
                    <span className="ml-2 font-mono normal-case">{d.time}</span>
                  )}
                </span>
                <h3 className="font-serif text-foreground text-lg leading-tight">
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
                Tickets
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
      {/* Map View */}
      <div className="min-h-[300px] w-full pb-6 md:h-[calc(100vh-12rem)] md:w-1/3">
        <TourMap attractions={attractions} dates={dates} ref={mapRef} />
      </div>
    </div>
  );
}
