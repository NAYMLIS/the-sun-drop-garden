"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getCategoryColor } from "@/lib/tour-map-style";
import type { Attraction, TourDate } from "@/lib/types";

type SearchResult =
  | { kind: "tour"; item: TourDate }
  | { kind: "attraction"; item: Attraction };

interface TourMapSearchProps {
  dates: TourDate[];
  attractions: Attraction[];
  onSelectTour: (city: TourDate) => void;
  onSelectAttraction: (attraction: Attraction) => void;
  isFullScreen: boolean;
}

const MAX_RESULTS = 8;
const WHITESPACE_RE = /\s+/;

function rank(query: string, label: string): number {
  if (!query) {
    return 0;
  }
  const q = query.toLowerCase();
  const l = label.toLowerCase();
  if (l === q) {
    return 100;
  }
  if (l.startsWith(q)) {
    return 80;
  }
  if (l.includes(q)) {
    return 50;
  }
  // Word-start boost
  const words = l.split(WHITESPACE_RE);
  if (words.some((w) => w.startsWith(q))) {
    return 60;
  }
  return 0;
}

export function TourMapSearch({
  dates,
  attractions,
  onSelectTour,
  onSelectAttraction,
  isFullScreen,
}: TourMapSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim();
    if (q.length < 1) {
      return [];
    }

    const scored: { score: number; result: SearchResult }[] = [];

    for (const d of dates) {
      const labelScore = Math.max(
        rank(q, d.city),
        rank(q, d.venue ?? ""),
        rank(q, d.address ?? "")
      );
      if (labelScore > 0) {
        // Tour stops bumped a little so they win ties
        scored.push({
          score: labelScore + 5,
          result: { kind: "tour", item: d },
        });
      }
    }

    for (const a of attractions) {
      const score = Math.max(
        rank(q, a.name),
        rank(q, a.city),
        rank(q, a.category ?? ""),
        rank(q, a.address ?? "")
      );
      if (score > 0) {
        scored.push({ score, result: { kind: "attraction", item: a } });
      }
    }

    scored.sort((x, y) => y.score - x.score);
    return scored.slice(0, MAX_RESULTS).map((s) => s.result);
  }, [query, dates, attractions]);

  // Close on click outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const select = (r: SearchResult) => {
    if (r.kind === "tour") {
      onSelectTour(r.item);
    } else {
      onSelectAttraction(r.item);
    }
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[highlighted];
      if (r) {
        select(r);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div
      className={`absolute z-30 ${
        isFullScreen ? "top-20 left-4 w-80" : "top-4 left-4 w-64 md:w-72"
      }`}
      ref={containerRef}
    >
      <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-background/95 px-3 py-2 shadow-lg backdrop-blur-md focus-within:border-primary/60">
        <Search className="text-foreground/50" size={14} />
        <input
          aria-label="Search tour stops or regenerative spots"
          className="w-full bg-transparent text-foreground text-xs outline-none placeholder:text-foreground/40"
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlighted(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search city or regenerative spot..."
          ref={inputRef}
          type="text"
          value={query}
        />
        {query && (
          <button
            aria-label="Clear search"
            className="text-foreground/40 hover:text-foreground/80"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            type="button"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-primary/20 bg-background/95 shadow-2xl backdrop-blur-md">
          {results.map((r, i) => {
            const isActive = i === highlighted;
            if (r.kind === "tour") {
              return (
                <button
                  className={`flex w-full items-center gap-2 border-primary/10 border-b px-3 py-2 text-left transition-colors last:border-b-0 ${
                    isActive ? "bg-primary/10" : "hover:bg-primary/5"
                  }`}
                  key={`tour-${r.item._id}`}
                  onClick={() => select(r)}
                  onMouseEnter={() => setHighlighted(i)}
                  type="button"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{
                      backgroundColor: "#d4af37",
                      boxShadow: "0 0 6px rgba(212, 175, 55, 0.6)",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-foreground text-xs">
                      {r.item.city}
                    </div>
                    <div className="truncate text-[10px] text-foreground/50">
                      Tour stop · {r.item.venue}
                    </div>
                  </div>
                </button>
              );
            }
            return (
              <button
                className={`flex w-full items-center gap-2 border-primary/10 border-b px-3 py-2 text-left transition-colors last:border-b-0 ${
                  isActive ? "bg-primary/10" : "hover:bg-primary/5"
                }`}
                key={`attraction-${r.item._id}`}
                onClick={() => select(r)}
                onMouseEnter={() => setHighlighted(i)}
                type="button"
              >
                <span
                  className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{
                    backgroundColor: getCategoryColor(r.item.category),
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-foreground text-xs">
                    {r.item.name}
                  </div>
                  <div className="truncate text-[10px] text-foreground/50">
                    {r.item.city}
                    {r.item.category ? ` · ${r.item.category}` : ""}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {open && query.trim().length > 0 && results.length === 0 && (
        <div className="mt-2 rounded-lg border border-primary/20 bg-background/95 px-3 py-2 text-[11px] text-foreground/60 shadow-lg backdrop-blur-md">
          No matches for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
