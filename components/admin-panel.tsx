"use client";

import { useMutation } from "convex/react";
import { MapPin, Search } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { TourDate } from "@/lib/types";

interface AdminPanelProps {
  dates: TourDate[];
}

interface CityResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
  };
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ dates }) => {
  const [city, setCity] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [lat, setLat] = useState("0");
  const [lng, setLng] = useState("0");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Search State
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addTourDate = useMutation(api.tourDates.add);

  const handleCitySearch = (query: string) => {
    setCity(query);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
        );
        const data = await response.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        console.error("City search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const selectCity = (result: CityResult) => {
    // Try to extract a clean city name
    const cityName =
      result.address?.city ||
      result.address?.town ||
      result.address?.village ||
      result.display_name.split(",")[0];
    setCity(cityName);
    setLat(Number.parseFloat(result.lat).toFixed(4));
    setLng(Number.parseFloat(result.lon).toFixed(4));
    setSearchResults([]);
    setShowResults(false);
  };

  const handleGenerate = async () => {
    if (!(city && venue)) {
      return;
    }
    setIsGenerating(true);

    // Clear previous values to show we are working
    setDescription("Consulting the stars...");

    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, venue }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate");
      }

      const info = await response.json();

      if (info) {
        setDescription(info.description);
        // Only override lat/lng if they are still 0 or user hasn't used search
        if (lat === "0" && lng === "0") {
          setLat(info.lat.toString());
          setLng(info.lng.toString());
        }
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setDescription("The stars are silent. Please enter details manually.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addTourDate({
        city,
        venue,
        date,
        lat: Number.parseFloat(lat),
        lng: Number.parseFloat(lng),
        ticketLink: "#",
        description: description || undefined,
      });

      // Reset
      setCity("");
      setVenue("");
      setDate("");
      setLat("0");
      setLng("0");
      setDescription("");
    } catch (error) {
      console.error("Failed to add tour date:", error);
    }
  };

  return (
    <div className="mx-auto mt-12 mb-24 max-w-2xl rounded-xl border border-primary/30 bg-card/10 p-8 backdrop-blur-md">
      <h2 className="mb-8 text-center font-serif text-3xl text-primary">
        Tour Administration
      </h2>

      <form className="relative" onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="grid grid-cols-2 gap-6">
            <div className="relative">
              <Field>
                <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                  City Search
                </FieldLabel>
                <div className="relative">
                  <Input
                    autoComplete="off"
                    className="w-full rounded border border-primary/20 bg-background/50 p-3 pl-10 text-foreground outline-none transition-colors focus:border-primary"
                    onChange={(e) => handleCitySearch(e.target.value)}
                    onFocus={() => city.length >= 3 && setShowResults(true)}
                    placeholder="Type to search..."
                    required
                    type="text"
                    value={city}
                  />
                  <Search
                    className="absolute top-3 left-3 text-primary/50"
                    size={16}
                  />
                  {isSearching && (
                    <div className="absolute top-3 right-3 h-4 w-4 animate-spin rounded-full border-2 border-primary/50 border-t-transparent" />
                  )}
                </div>

                {/* Search Dropdown */}
                {showResults && searchResults.length > 0 && (
                  <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded border border-primary/20 bg-background shadow-xl">
                    {searchResults.map((result) => (
                      <button
                        className="w-full cursor-pointer border-primary/5 border-b p-3 text-left transition-colors last:border-0 hover:bg-primary/10"
                        key={result.place_id}
                        onClick={() => selectCity(result)}
                        type="button"
                      >
                        <div className="font-bold text-foreground text-sm">
                          {result.display_name.split(",")[0]}
                        </div>
                        <div className="truncate text-foreground/50 text-xs">
                          {result.display_name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                Venue
              </FieldLabel>
              <Input
                className="w-full rounded border border-primary/20 bg-background/50 p-3 text-foreground outline-none transition-colors focus:border-primary"
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Royal Albert Hall"
                required
                type="text"
                value={venue}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
              Date
            </FieldLabel>
            <Input
              className="w-full rounded border border-primary/20 bg-background/50 p-3 text-foreground outline-none transition-colors focus:border-primary"
              onChange={(e) => setDate(e.target.value)}
              required
              type="date"
              value={date}
            />
          </Field>

          {/* AI Helper Button */}
          <div className="flex justify-end">
            <button
              className="flex items-center gap-2 text-primary text-xs uppercase tracking-widest transition-colors hover:text-foreground disabled:opacity-50"
              disabled={isGenerating || !city || !venue}
              onClick={handleGenerate}
              type="button"
            >
              <span
                className={`h-2 w-2 rounded-full bg-primary ${isGenerating ? "animate-pulse" : ""}`}
              />
              {isGenerating
                ? "Consulting the Oracle..."
                : "Generate Description with AI"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Field>
              <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                Latitude
              </FieldLabel>
              <Input
                className="w-full rounded border border-primary/20 bg-background/50 p-3 font-mono text-foreground text-sm outline-none transition-colors focus:border-primary"
                onChange={(e) => setLat(e.target.value)}
                required
                step="0.0001"
                type="number"
                value={lat}
              />
            </Field>
            <Field>
              <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                Longitude
              </FieldLabel>
              <Input
                className="w-full rounded border border-primary/20 bg-background/50 p-3 font-mono text-foreground text-sm outline-none transition-colors focus:border-primary"
                onChange={(e) => setLng(e.target.value)}
                required
                step="0.0001"
                type="number"
                value={lng}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
              Vibe Description
            </FieldLabel>
            <Textarea
              className="min-h-[100px] w-full rounded border border-primary/20 bg-background/50 p-3 text-foreground italic outline-none transition-colors focus:border-primary"
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Generated or custom description will appear here..."
              rows={3}
              value={description}
            />
          </Field>

          <Button
            className="mt-4 w-full rounded bg-primary py-3 font-serif text-background text-xl transition-colors hover:bg-foreground"
            type="submit"
          >
            Add to Tour
          </Button>
        </FieldGroup>
      </form>

      <div className="mt-12">
        <h3 className="mb-4 font-serif text-foreground text-xl">
          Current Schedule
        </h3>
        <ul className="space-y-2 opacity-70">
          {dates.map((d) => (
            <li
              className="flex justify-between border-primary/10 border-b pb-2 text-sm"
              key={d._id}
            >
              <span className="flex-1">{d.date}</span>
              <span className="flex-1 font-bold">{d.city}</span>
              <span className="flex flex-1 items-center justify-end gap-1 text-right text-xs italic opacity-70">
                <MapPin size={10} />
                {d.lat.toFixed(2)}, {d.lng.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
