"use client";

import { drag } from "d3-drag";
import type { GeoPermissibleObjects } from "d3-geo";
import {
  geoDistance,
  geoOrthographic,
  geoPath,
  pointer,
  select,
  timer,
  zoom,
  zoomIdentity,
} from "d3-geo";
import { Calendar, MapPin, Ticket, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { TourDate } from "@/lib/types";

interface TourMapProps {
  dates: TourDate[];
}

interface WorldAtlas extends Topology {
  objects: {
    countries: GeometryCollection;
  };
}

type WorldDataType = GeoJSON.FeatureCollection<
  GeoJSON.Geometry,
  GeoJSON.GeoJsonProperties
>;

interface SphereGeometry {
  type: "Sphere";
}

interface RouteGeometry {
  type: "LineString";
  coordinates: [number, number][];
}

export const TourMap: React.FC<TourMapProps> = ({ dates }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [worldData, setWorldData] = useState<WorldDataType | null>(null);
  const [selectedCity, setSelectedCity] = useState<TourDate | null>(null);

  // Refs to maintain state across renders without triggering re-initialization of the map
  const selectedCityRef = useRef<TourDate | null>(null);
  const renderRef = useRef<() => void>(() => {
    // Initial empty render function - replaced during initialization
  });
  const userInteracted = useRef(false);
  const projectionRef = useRef(geoOrthographic().clipAngle(90));

  // Sync state to ref and trigger a re-render of the canvas only (without resetting zoom)
  useEffect(() => {
    selectedCityRef.current = selectedCity;
    if (renderRef.current) {
      renderRef.current();
    }
  }, [selectedCity]);

  // Load World Data
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data: WorldAtlas) => {
        setWorldData(feature(data, data.objects.countries));
      })
      .catch((err) => {
        console.error("Failed to load world data", err);
      });
  }, []);

  // Initialize and Render Globe
  // IMPORTANT: selectedCity is NOT in the dependency array to prevent zoom reset on click
  useEffect(() => {
    if (!(canvasRef.current && containerRef.current)) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const selectCanvas = select(canvas);

    // Sort dates for path
    const sortedDates = [...dates].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Initial centering logic
    if (!userInteracted.current && sortedDates.length > 0) {
      const avgLng =
        sortedDates.reduce((s, d) => s + d.lng, 0) / sortedDates.length;
      const avgLat =
        sortedDates.reduce((s, d) => s + d.lat, 0) / sortedDates.length;
      projectionRef.current.rotate([-avgLng, -avgLat]);
    }

    const route: RouteGeometry = {
      type: "LineString",
      coordinates: sortedDates.map((d) => [d.lng, d.lat]),
    };

    const rotationVelocity = 0.1;
    const path = geoPath(projectionRef.current, context);

    const render = () => {
      if (!(context && canvas)) {
        return;
      }
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      context.clearRect(0, 0, width, height);

      const projection = projectionRef.current;

      // 1. Globe Sphere (Background/Water)
      const sphere: SphereGeometry = { type: "Sphere" };
      context.beginPath();
      path(sphere as GeoPermissibleObjects);
      context.fillStyle = "rgba(47, 62, 43, 0.2)";
      context.fill();
      context.lineWidth = 1;
      context.strokeStyle = "rgba(212, 175, 55, 0.2)";
      context.stroke();

      // 2. Land
      if (worldData) {
        context.beginPath();
        path(worldData);
        context.fillStyle = "rgba(243, 233, 210, 0.15)";
        context.fill();
        context.lineWidth = 0.5;
        context.strokeStyle = "rgba(26, 24, 20, 0.5)";
        context.stroke();
      }

      // 3. Path
      if (sortedDates.length > 1) {
        context.beginPath();
        path(route as GeoPermissibleObjects);
        context.lineWidth = 2;
        context.strokeStyle = "rgba(212, 175, 55, 0.8)";
        context.setLineDash([3, 3]);
        context.stroke();
        context.setLineDash([]);
      }

      // 4. Cities
      renderCities(sortedDates, projection, context, width, height);
    };

    const renderCities = (
      cities: TourDate[],
      projection: ReturnType<typeof geoOrthographic>,
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number
    ) => {
      for (const d of cities) {
        const center = projection.invert
          ? projection.invert([width / 2, height / 2])
          : [0, 0];
        const distance = geoDistance(center as [number, number], [
          d.lng,
          d.lat,
        ]);

        if (distance < 1.57) {
          const coords = projection([d.lng, d.lat]);
          if (coords) {
            const [x, y] = coords;
            const isSelected = selectedCityRef.current?._id === d._id;

            drawCityMarker(ctx, x, y, isSelected, d.city);
          }
        }
      }
    };

    const drawCityMarker = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      isSelected: boolean,
      cityName: string
    ) => {
      // Glow
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 12 : 8, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected
        ? "rgba(212, 175, 55, 0.8)"
        : "rgba(212, 175, 55, 0.4)";
      ctx.fill();

      // Inner Dot
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = "#d4af37";
      ctx.fill();

      // Label
      ctx.textAlign = "left";
      ctx.font = isSelected ? "bold 14px Montserrat" : "500 12px Montserrat";
      ctx.fillStyle = "#f3e9d2";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(cityName, x + 15, y + 4);
      ctx.shadowBlur = 0;
    };

    // Update ref so the other useEffect can call it
    renderRef.current = render;

    // --- Interaction Handlers ---

    // Zoom
    const zoomBehavior = zoom()
      .scaleExtent([100, 3000])
      .on("start", () => {
        userInteracted.current = true;
      })
      .on("zoom", (event) => {
        projectionRef.current.scale(event.transform.k);
        render();
      });

    // Drag
    const dragBehavior = drag()
      .on("start", () => {
        userInteracted.current = true;
      })
      .on("drag", (event) => {
        const rotate = projectionRef.current.rotate();
        const k = 75 / projectionRef.current.scale();
        projectionRef.current.rotate([
          rotate[0] + event.dx * k,
          rotate[1] - event.dy * k,
        ]);
        render();
      });

    // Helper for finding city under mouse
    const getClosestCity = (
      event: MouseEvent | PointerEvent
    ): TourDate | null => {
      const [mouseX, mouseY] = pointer(event, canvas);
      const projection = projectionRef.current;
      const dpr = window.devicePixelRatio || 1;

      return findNearestVisibleCity(
        sortedDates,
        mouseX,
        mouseY,
        projection,
        canvas.width / dpr,
        canvas.height / dpr
      );
    };

    const findNearestVisibleCity = (
      cities: TourDate[],
      mouseX: number,
      mouseY: number,
      projection: ReturnType<typeof geoOrthographic>,
      canvasWidth: number,
      canvasHeight: number
    ): TourDate | null => {
      let closest: TourDate | null = null;
      let minDist = 20;

      for (const d of cities) {
        const isVisible = isCityVisible(
          d,
          projection,
          canvasWidth,
          canvasHeight
        );

        if (isVisible) {
          const coords = projection([d.lng, d.lat]);
          if (coords) {
            const distance = calculateDistance(
              mouseX,
              mouseY,
              coords[0],
              coords[1]
            );
            if (distance < minDist) {
              minDist = distance;
              closest = d;
            }
          }
        }
      }
      return closest;
    };

    const isCityVisible = (
      city: TourDate,
      projection: ReturnType<typeof geoOrthographic>,
      canvasWidth: number,
      canvasHeight: number
    ): boolean => {
      const center = projection.invert
        ? projection.invert([canvasWidth / 2, canvasHeight / 2])
        : [0, 0];
      const geoDist = geoDistance(center as [number, number], [
        city.lng,
        city.lat,
      ]);
      return geoDist < 1.57;
    };

    const calculateDistance = (
      x1: number,
      y1: number,
      x2: number,
      y2: number
    ): number => {
      const dx = x1 - x2;
      const dy = y1 - y2;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // Click (Hit Testing)
    selectCanvas.on("click", (event) => {
      userInteracted.current = true;
      const closest = getClosestCity(event);
      setSelectedCity(closest);
    });

    // Hover (Cursor change)
    selectCanvas.on("mousemove", (event) => {
      const closest = getClosestCity(event);
      canvas.style.cursor = closest ? "pointer" : "move";
    });

    // --- Resize Logic ---
    const resizeCanvas = () => {
      if (!containerRef.current) {
        return;
      }

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight || 500;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.scale(dpr, dpr);

      const newScale = Math.min(width, height) / 2.2;

      // Update projection settings
      projectionRef.current.scale(newScale).translate([width / 2, height / 2]);

      // Sync zoom behavior state
      // @ts-expect-error - D3 type compatibility
      selectCanvas.call(zoomBehavior.transform, zoomIdentity.scale(newScale));

      render();
    };

    // --- Attach Behaviors ---
    // @ts-expect-error - D3 type mismatch between DragBehavior<Element> and Selection<HTMLCanvasElement>
    selectCanvas.call(dragBehavior);
    // @ts-expect-error - D3 type mismatch between ZoomBehavior<Element> and Selection<HTMLCanvasElement>
    const zoomedCanvas = selectCanvas.call(zoomBehavior);
    zoomedCanvas.on("mousedown.zoom", null).on("dblclick.zoom", null);

    resizeCanvas();

    // --- Animation Loop ---
    const animationTimer = timer(() => {
      if (!userInteracted.current) {
        const r = projectionRef.current.rotate();
        projectionRef.current.rotate([r[0] + rotationVelocity, r[1]]);
        render();
      }
    });

    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Force one render in case data loaded
    if (worldData) {
      render();
    }

    return () => {
      animationTimer.stop();
      resizeObserver.disconnect();
    };
  }, [worldData, dates]); // Removed selectedCity from here to prevent re-init

  return (
    <div
      className="group relative flex h-full min-h-[400px] w-full items-center justify-center overflow-hidden rounded-lg border border-primary/10 bg-background/30"
      ref={containerRef}
    >
      <canvas ref={canvasRef} />

      <div className="pointer-events-none absolute right-4 bottom-4 text-primary/40 text-xs uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100">
        Drag & Scroll • Click Cities
      </div>

      {/* Selected City Popup */}
      {selectedCity && (
        <div className="absolute right-4 bottom-4 left-4 z-20 animate-fade-in-up rounded-lg border border-primary/30 bg-background/95 p-4 shadow-2xl backdrop-blur-md md:right-auto md:bottom-4 md:left-4 md:max-w-xs">
          <button
            className="absolute top-2 right-2 text-primary/50 transition-colors hover:text-foreground"
            onClick={() => setSelectedCity(null)}
            type="button"
          >
            <X size={16} />
          </button>
          <div className="pr-6">
            <h3 className="mb-1 font-serif text-primary text-xl">
              {selectedCity.city}
            </h3>
            <p className="mb-3 flex items-center gap-1 text-foreground/60 text-xs uppercase tracking-widest">
              <MapPin size={10} /> {selectedCity.venue}
            </p>
            <p className="mb-3 font-serif text-foreground/80 text-sm italic leading-relaxed">
              "{selectedCity.description}"
            </p>
            <div className="mt-2 flex items-center justify-between border-primary/10 border-t pt-3">
              <span className="flex items-center gap-1 font-mono text-primary/70 text-xs">
                <Calendar size={10} />
                {new Date(selectedCity.date).toLocaleDateString()}
              </span>
              <a
                className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 font-bold text-primary text-xs uppercase tracking-wider transition-colors hover:bg-primary hover:text-primary-foreground"
                href={selectedCity.ticketLink}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Ticket size={10} /> Get Tickets
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
