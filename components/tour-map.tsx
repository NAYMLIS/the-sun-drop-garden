"use client";

import { drag } from "d3-drag";
import { easeCubicInOut } from "d3-ease";
import type { GeoPermissibleObjects } from "d3-geo";
import { geoDistance, geoOrthographic, geoPath } from "d3-geo";
import { pointer, select } from "d3-selection";
import { timer } from "d3-timer";
import { zoom, zoomIdentity } from "d3-zoom";
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
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { calculateTourCenterRotation } from "@/lib/map-utils";
import type { Attraction, AttractionCategory, TourDate } from "@/lib/types";

interface TourMapProps {
  dates: TourDate[];
  attractions: Attraction[];
}

export interface TourMapRef {
  navigateToCity: (city: TourDate) => void;
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

const getCategoryColor = (category: AttractionCategory): string => {
  const colors: Record<AttractionCategory, string> = {
    environmental: "rgba(34, 139, 34, 0.8)", // Forest green
    vendors: "rgba(255, 140, 0, 0.8)", // Dark orange
    venues: "rgba(138, 43, 226, 0.8)", // Blue violet
    services: "rgba(70, 130, 180, 0.8)", // Steel blue
    education: "rgba(25, 25, 112, 0.8)", // Midnight blue
    art: "rgba(199, 21, 133, 0.8)", // Medium violet red
    wellness: "rgba(255, 20, 147, 0.8)", // Deep pink
    miscellaneous: "rgba(128, 128, 128, 0.8)", // Gray
    accommodation: "rgba(184, 134, 11, 0.8)", // Dark goldenrod
  };
  return colors[category] || "rgba(128, 128, 128, 0.8)";
};

export const TourMap = forwardRef<TourMapRef, TourMapProps>(
  ({ dates, attractions }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [worldData, setWorldData] = useState<WorldDataType | null>(null);
    const [selectedCity, setSelectedCity] = useState<TourDate | null>(null);
    const [selectedAttraction, setSelectedAttraction] =
      useState<Attraction | null>(null);
    const [showAttractionTags, setShowAttractionTags] = useState(false);
    const showAttractionTagsRef = useRef(false);

    // Refs to maintain state across renders without triggering re-initialization of the map
    const selectedCityRef = useRef<TourDate | null>(null);
    const selectedAttractionRef = useRef<Attraction | null>(null);
    const renderRef = useRef<() => void>(() => {
      // Initial empty render function - replaced during initialization
    });
    const userInteracted = useRef(false);
    const projectionRef = useRef(geoOrthographic().clipAngle(90));
    const zoomBehaviorRef = useRef<ReturnType<typeof zoom> | null>(null);
    const selectCanvasRef = useRef<ReturnType<typeof select> | null>(null);
    const navigateToCityRef = useRef<((city: TourDate) => void) | null>(null);
    const zoomToShowAttractionsRef = useRef<(() => void) | null>(null);
    const initialRotationSet = useRef(false);

    // Expose navigateToCity via ref
    useImperativeHandle(
      ref,
      () => ({
        navigateToCity: (city: TourDate) => {
          // Call the function stored in ref (set inside useEffect)
          // Use setTimeout to ensure it runs after current execution
          if (navigateToCityRef.current) {
            navigateToCityRef.current(city);
          } else {
            // If ref not ready, try again on next tick
            setTimeout(() => {
              if (navigateToCityRef.current) {
                navigateToCityRef.current(city);
              }
            }, 0);
          }
        },
      }),
      []
    );

    // Get sorted dates for navigation
    const sortedDates = [...dates].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Get current date index
    const currentIndex = selectedCity
      ? sortedDates.findIndex((d) => d._id === selectedCity._id)
      : -1;

    // Navigation functions
    const navigateToPrevious = () => {
      if (currentIndex > 0 && navigateToCityRef.current) {
        navigateToCityRef.current(sortedDates[currentIndex - 1]);
      }
    };

    const navigateToNext = () => {
      if (
        currentIndex >= 0 &&
        currentIndex < sortedDates.length - 1 &&
        navigateToCityRef.current
      ) {
        navigateToCityRef.current(sortedDates[currentIndex + 1]);
      }
    };

    // Reset tags visibility when city changes
    // biome-ignore lint/correctness/useExhaustiveDependencies: Reset tags when city changes, but effect doesn't directly use selectedCity
    useEffect(() => {
      setShowAttractionTags(false);
      showAttractionTagsRef.current = false;
    }, [selectedCity]);

    // Sync showAttractionTags to ref
    useEffect(() => {
      showAttractionTagsRef.current = showAttractionTags;
    }, [showAttractionTags]);

    // Sync state to ref and trigger a re-render of the canvas only (without resetting zoom)
    useEffect(() => {
      selectedCityRef.current = selectedCity;
      if (renderRef.current) {
        renderRef.current();
      }
    }, [selectedCity]);

    useEffect(() => {
      selectedAttractionRef.current = selectedAttraction;
      if (renderRef.current) {
        renderRef.current();
      }
    }, [selectedAttraction]);

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
        const currentScale = projection.scale();
        renderCities(
          sortedDates,
          projection,
          context,
          width,
          height,
          currentScale
        );

        // 5. Attractions (only when a city is selected, toggle is active, and zoomed in enough)
        if (selectedCityRef.current) {
          const cityAttractions = attractions.filter(
            (a) => a.city === selectedCityRef.current?.city
          );
          // Calculate initial/default scale for comparison
          const initialScale = Math.min(width, height) / 2.2;
          // Only show attractions when toggle is active AND zoomed in enough (2x initial scale)
          const shouldShowAttractions =
            showAttractionTagsRef.current && currentScale >= initialScale * 2;
          if (shouldShowAttractions) {
            renderAttractions(
              cityAttractions,
              projection,
              context,
              width,
              height
            );
          }
        }
      };

      const renderCities = (
        cities: TourDate[],
        projection: ReturnType<typeof geoOrthographic>,
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        currentScale: number
      ) => {
        // Calculate initial/default scale for comparison
        const initialScale = Math.min(width, height) / 2.2;
        // Only show labels when zoomed in (scale is at least 1.5x initial) or city is selected
        const showLabels = currentScale >= initialScale * 1.5;

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

              drawCityMarker(
                ctx,
                x,
                y,
                isSelected,
                d.city,
                isSelected || showLabels
              );
            }
          }
        }
      };

      const drawCityMarker = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        isSelected: boolean,
        cityName: string,
        showLabel: boolean
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

        // Label (only show when zoomed in or selected)
        if (showLabel) {
          ctx.textAlign = "left";
          ctx.font = isSelected
            ? "bold 14px Montserrat"
            : "500 12px Montserrat";
          ctx.fillStyle = "#f3e9d2";
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowBlur = 4;
          ctx.fillText(cityName, x + 15, y + 4);
          ctx.shadowBlur = 0;
        }
      };

      const renderAttractions = (
        cityAttractions: Attraction[],
        projection: ReturnType<typeof geoOrthographic>,
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number
      ) => {
        for (const attraction of cityAttractions) {
          const center = projection.invert
            ? projection.invert([width / 2, height / 2])
            : [0, 0];
          const distance = geoDistance(center as [number, number], [
            attraction.lng,
            attraction.lat,
          ]);

          if (distance < 1.57) {
            const coords = projection([attraction.lng, attraction.lat]);
            if (coords) {
              const [x, y] = coords;
              const isSelected =
                selectedAttractionRef.current?._id === attraction._id;

              drawAttractionMarker(
                ctx,
                x,
                y,
                isSelected,
                attraction.category,
                attraction.name
              );
            }
          }
        }
      };

      const drawAttractionMarker = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        isSelected: boolean,
        category: AttractionCategory,
        name: string
      ) => {
        const color = getCategoryColor(category);

        // Glow
        ctx.beginPath();
        ctx.arc(x, y, isSelected ? 8 : 5, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected
          ? color.replace("0.8", "0.6")
          : color.replace("0.8", "0.3");
        ctx.fill();

        // Inner Dot
        ctx.beginPath();
        ctx.arc(x, y, isSelected ? 4 : 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = color.replace("0.8", "1");
        ctx.fill();

        // Label (only if selected)
        if (isSelected) {
          ctx.textAlign = "left";
          ctx.font = "500 11px Montserrat";
          ctx.fillStyle = "#f3e9d2";
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowBlur = 3;
          ctx.fillText(name, x + 12, y + 3);
          ctx.shadowBlur = 0;
        }
      };

      // Update ref so the other useEffect can call it
      renderRef.current = render;

      // --- Interaction Handlers ---

      // Zoom
      const zoomBehavior = zoom()
        .scaleExtent([100, 3000])
        .on("start", (event) => {
          // Only mark as user interaction if it's from a real event (not programmatic)
          // Programmatic transforms have sourceEvent as null/undefined (falsy)
          if (event.sourceEvent) {
            userInteracted.current = true;
          }
        })
        .on("zoom", (event) => {
          projectionRef.current.scale(event.transform.k);
          render();
        });

      // Store refs for use in click handler
      zoomBehaviorRef.current = zoomBehavior;
      // @ts-expect-error - D3 type compatibility: selectCanvas is typed for HTMLCanvasElement but works with BaseType
      selectCanvasRef.current = selectCanvas;

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

      // Helper for finding attraction under mouse
      const getClosestAttraction = (
        event: MouseEvent | PointerEvent
      ): Attraction | null => {
        if (!selectedCityRef.current) {
          return null;
        }

        // Only allow clicking attractions if toggle is active and zoomed in enough
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;
        const currentScale = projectionRef.current.scale();
        const initialScale = Math.min(width, height) / 2.2;
        const shouldShowAttractions =
          showAttractionTagsRef.current && currentScale >= initialScale * 2;

        if (!shouldShowAttractions) {
          return null;
        }

        const [mouseX, mouseY] = pointer(event, canvas);
        const projection = projectionRef.current;

        const cityAttractions = attractions.filter(
          (a) => a.city === selectedCityRef.current?.city
        );

        return findNearestVisibleAttraction(
          cityAttractions,
          mouseX,
          mouseY,
          projection,
          canvas.width / dpr,
          canvas.height / dpr
        );
      };

      const findNearestVisibleAttraction = (
        attrs: Attraction[],
        mouseX: number,
        mouseY: number,
        projection: ReturnType<typeof geoOrthographic>,
        canvasWidth: number,
        canvasHeight: number
      ): Attraction | null => {
        let closest: Attraction | null = null;
        let minDist = 15;

        for (const attr of attrs) {
          const isVisible = isAttractionVisible(
            attr,
            projection,
            canvasWidth,
            canvasHeight
          );

          if (isVisible) {
            const coords = projection([attr.lng, attr.lat]);
            if (coords) {
              const distance = calculateDistance(
                mouseX,
                mouseY,
                coords[0],
                coords[1]
              );
              if (distance < minDist) {
                minDist = distance;
                closest = attr;
              }
            }
          }
        }
        return closest;
      };

      const isAttractionVisible = (
        attraction: Attraction,
        projection: ReturnType<typeof geoOrthographic>,
        canvasWidth: number,
        canvasHeight: number
      ): boolean => {
        const center = projection.invert
          ? projection.invert([canvasWidth / 2, canvasHeight / 2])
          : [0, 0];
        const geoDist = geoDistance(center as [number, number], [
          attraction.lng,
          attraction.lat,
        ]);
        return geoDist < 1.57;
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

      // Smooth navigation function that combines rotation and zoom
      const navigateToCity = (city: TourDate) => {
        if (
          !(
            canvasRef.current &&
            zoomBehaviorRef.current &&
            selectCanvasRef.current
          )
        ) {
          return;
        }

        const dpr = window.devicePixelRatio || 1;
        const width = canvasRef.current.width / dpr;
        const height = canvasRef.current.height / dpr;
        const currentScale = projectionRef.current.scale();
        const currentRotate = projectionRef.current.rotate();

        // Calculate initial/default scale for comparison
        const initialScale = Math.min(width, height) / 2.2;
        const isAtInitialScale =
          Math.abs(currentScale - initialScale) / initialScale < 0.1;

        // Check if already at this location (skip animation if close)
        const isSameCity = selectedCityRef.current?._id === city._id;
        const targetRotate: [number, number, number] = [
          -city.lng,
          -city.lat,
          0,
        ];
        const rotationDiff =
          Math.abs(currentRotate[0] - targetRotate[0]) +
          Math.abs(currentRotate[1] - targetRotate[1]);

        // If at initial scale, zoom directly to target. Otherwise, multiply current scale
        const targetScale = isAtInitialScale
          ? Math.min(initialScale * 2.5, 2000)
          : Math.min(currentScale * 2.5, 2000);
        const scaleDiff = Math.abs(currentScale - targetScale) / currentScale;

        // Skip if already at location (within 2 degrees rotation and 5% scale)
        if (isSameCity && rotationDiff < 2 && scaleDiff < 0.05) {
          setSelectedCity(city);
          setSelectedAttraction(null);
          return;
        }

        // Set selected city
        setSelectedCity(city);
        setSelectedAttraction(null);

        // Calculate card offset to position pin above card
        // Card is at bottom-4 (16px), full width now, estimated height ~200-250px
        // Add buffer space above card (~50px)
        const cardHeight = 250; // Estimated card height including padding
        const cardBottomOffset = 16; // bottom-4 = 16px
        const bufferSpace = 50; // Space above card for pin visibility
        const _cardOffset = cardHeight + cardBottomOffset + bufferSpace;

        // Animate rotation and zoom together
        const startRotate = [...currentRotate] as [number, number, number];
        const duration = 1100;

        // Animate rotation using requestAnimationFrame
        let startTime: number | null = null;
        const animateRotation = (currentTime: number) => {
          if (startTime === null) {
            startTime = currentTime;
          }
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = easeCubicInOut(progress);

          // Interpolate rotation
          const rotateLng =
            startRotate[0] + (targetRotate[0] - startRotate[0]) * eased;
          const rotateLat =
            startRotate[1] + (targetRotate[1] - startRotate[1]) * eased;
          projectionRef.current.rotate([rotateLng, rotateLat, 0]);

          // Keep projection translate at center so city centers correctly
          projectionRef.current.translate([width / 2, height / 2]);

          if (renderRef.current) {
            renderRef.current();
          }

          if (progress < 1) {
            requestAnimationFrame(animateRotation);
          } else {
            // Final state - keep at center for correct pin positioning
            projectionRef.current.rotate(targetRotate);
            projectionRef.current.translate([width / 2, height / 2]);
            if (renderRef.current) {
              renderRef.current();
            }
          }
        };

        // Start rotation animation
        userInteracted.current = true;
        requestAnimationFrame(animateRotation);

        // Sync zoom transform with current projection scale before transitioning
        // This prevents the zoom out/in effect on first click
        const currentTransform = zoomIdentity
          .translate(width / 2, height / 2)
          .scale(currentScale)
          .translate(-width / 2, -height / 2);

        // Set current state immediately (without transition) to sync
        if (selectCanvasRef.current && zoomBehaviorRef.current) {
          selectCanvasRef.current.call(
            // @ts-expect-error - D3 type compatibility: transform expects Transition but works with Selection
            zoomBehaviorRef.current.transform,
            currentTransform
          );
        }

        // Zoom transform - keep at center since projection translate handles the offset
        const targetTransform = zoomIdentity
          .translate(width / 2, height / 2)
          .scale(targetScale)
          .translate(-width / 2, -height / 2);

        selectCanvasRef.current
          .transition()
          .duration(duration)
          .ease(easeCubicInOut)
          // @ts-expect-error - D3 type compatibility: transform expects Transition but works with Selection
          .call(zoomBehaviorRef.current.transform, targetTransform);
      };

      // Function to zoom in further for showing attractions
      const zoomToShowAttractions = () => {
        if (
          !(
            canvasRef.current &&
            zoomBehaviorRef.current &&
            selectCanvasRef.current &&
            selectedCityRef.current
          )
        ) {
          return;
        }

        const dpr = window.devicePixelRatio || 1;
        const width = canvasRef.current.width / dpr;
        const height = canvasRef.current.height / dpr;
        const currentScale = projectionRef.current.scale();
        const initialScale = Math.min(width, height) / 2.2;

        // Zoom to 3.5x initial scale to show attractions nicely dispersed
        const targetScale = Math.min(initialScale * 3.5, 2000);
        const scaleDiff = Math.abs(currentScale - targetScale) / currentScale;

        // Skip if already at target zoom (within 5%)
        if (scaleDiff < 0.05) {
          return;
        }

        const duration = 800;

        // Zoom transform
        const targetTransform = zoomIdentity
          .translate(width / 2, height / 2)
          .scale(targetScale)
          .translate(-width / 2, -height / 2);

        selectCanvasRef.current
          .transition()
          .duration(duration)
          .ease(easeCubicInOut)
          // @ts-expect-error - D3 type compatibility: transform expects Transition but works with Selection
          .call(zoomBehaviorRef.current.transform, targetTransform);
      };

      // Store navigate function in ref for useImperativeHandle
      navigateToCityRef.current = navigateToCity;
      // Store zoom function in ref for toggle button
      zoomToShowAttractionsRef.current = zoomToShowAttractions;

      // Click (Hit Testing)
      selectCanvas.on("click", (event) => {
        userInteracted.current = true;
        // Check for attraction first (if city is selected)
        const closestAttraction = getClosestAttraction(event);
        if (closestAttraction) {
          setSelectedAttraction(closestAttraction);
          return;
        }
        // Otherwise check for city
        const closest = getClosestCity(event);
        if (closest) {
          navigateToCity(closest);
        } else {
          // Click on empty space - deselect and zoom out
          setSelectedCity(null);
          setSelectedAttraction(null);

          // Zoom out to show all cities
          const dpr = window.devicePixelRatio || 1;
          const width = canvas.width / dpr;
          const height = canvas.height / dpr;
          const _currentScale = projectionRef.current.scale();
          const defaultScale = Math.min(width, height) / 2.2;

          if (zoomBehaviorRef.current && selectCanvasRef.current) {
            const targetTransform = zoomIdentity
              .translate(width / 2, height / 2)
              .scale(defaultScale)
              .translate(-width / 2, -height / 2);

            selectCanvasRef.current
              .transition()
              .duration(750)
              // @ts-expect-error - D3 type compatibility: transform expects Transition but works with Selection
              .call(zoomBehaviorRef.current.transform, targetTransform);
          }
        }
      });

      // Hover (Cursor change)
      selectCanvas.on("mousemove", (event) => {
        const closestAttraction = getClosestAttraction(event);
        const closestCity = getClosestCity(event);
        canvas.style.cursor =
          closestAttraction || closestCity ? "pointer" : "move";
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

        // Calculate rotation from dates if:
        // 1. We haven't set the initial rotation yet
        // 2. User hasn't manually interacted with the globe
        // 3. We have tour dates to center on
        let rotationToUse: [number, number, number];
        const shouldSetInitialRotation =
          !(initialRotationSet.current || userInteracted.current) &&
          sortedDates.length > 0;

        if (shouldSetInitialRotation) {
          const calculatedRotation = calculateTourCenterRotation(sortedDates);
          if (calculatedRotation) {
            rotationToUse = calculatedRotation;
            initialRotationSet.current = true;
          } else {
            // Fallback to current rotation if calculation fails
            rotationToUse = projectionRef.current.rotate() as [
              number,
              number,
              number,
            ];
          }
        } else {
          // Preserve current rotation
          rotationToUse = projectionRef.current.rotate() as [
            number,
            number,
            number,
          ];
        }

        // Update projection settings
        projectionRef.current
          .scale(newScale)
          .translate([width / 2, height / 2])
          .rotate(rotationToUse);

        // Sync zoom behavior state (programmatic - won't trigger userInteracted)
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
      // Auto-rotate only if user hasn't interacted, we have dates, and rotation is not default
      const animationTimer = timer(() => {
        if (!userInteracted.current && sortedDates.length > 0) {
          const r = projectionRef.current.rotate();
          // Don't start auto-rotating if rotation is still at default [0,0,0]
          // This ensures we wait for initial rotation to be set from dates
          if (r[0] === 0 && r[1] === 0) {
            return;
          }
          // Only rotate longitude (spin around), keep latitude centered
          projectionRef.current.rotate([r[0] + rotationVelocity, r[1]]);
          render();
        }
      });

      const resizeObserver = new ResizeObserver(resizeCanvas);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      // Force render after setting up everything
      // Only render if rotation was set or if we don't have dates yet (to show default view)
      // If we have dates but rotation wasn't set, it means user interacted, so render anyway
      render();

      return () => {
        animationTimer.stop();
        resizeObserver.disconnect();
      };
    }, [worldData, dates, attractions]); // Removed selectedCity from here to prevent re-init

    return (
      <div
        className="group relative flex h-full min-h-[400px] w-full items-center justify-center overflow-hidden rounded-lg border border-primary/10 bg-background/30"
        ref={containerRef}
      >
        <canvas ref={canvasRef} />

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
          <div className="absolute right-4 bottom-4 left-4 z-20 animate-fade-in-up rounded-lg border border-primary/30 bg-background/95 p-3 shadow-2xl backdrop-blur-md md:right-4 md:bottom-4 md:left-4">
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
              {(() => {
                const cityAttractions = attractions.filter(
                  (a) => a.city === selectedCity.city
                );
                const uniqueCategories = [
                  ...new Set(cityAttractions.map((a) => a.category)),
                ];
                return cityAttractions.length > 0 ? (
                  <div className="mt-2 border-primary/10 border-t pt-2">
                    <button
                      className="mb-2 flex w-full items-center justify-between text-foreground/40 text-xs italic transition-colors hover:text-foreground/60"
                      onClick={(e) => {
                        e.stopPropagation();
                        const isExpanding = !showAttractionTags;
                        if (isExpanding && zoomToShowAttractionsRef.current) {
                          // Zoom in first, then show tags
                          zoomToShowAttractionsRef.current();
                          // Small delay to let zoom start, then show tags
                          setTimeout(() => {
                            setShowAttractionTags(true);
                          }, 100);
                        } else {
                          // Just toggle when collapsing
                          setShowAttractionTags(!showAttractionTags);
                        }
                      }}
                      type="button"
                    >
                      <span>
                        {cityAttractions.length} community destinations nearby
                      </span>
                      {showAttractionTags ? (
                        <ChevronUp
                          className="text-foreground/40 transition-colors"
                          size={14}
                        />
                      ) : (
                        <ChevronDown
                          className="text-foreground/40 transition-colors"
                          size={14}
                        />
                      )}
                    </button>
                    {showAttractionTags && (
                      <div className="flex flex-wrap gap-2">
                        {uniqueCategories.map((category) => (
                          <span
                            className="inline-block rounded-full bg-foreground/10 px-2 py-1 text-foreground/70 text-xs uppercase tracking-wider"
                            key={category}
                            style={{
                              backgroundColor: `${getCategoryColor(category)}20`,
                              color: getCategoryColor(category).replace(
                                "0.8",
                                "1"
                              ),
                            }}
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        )}

        {/* Selected Attraction Popup */}
        {selectedAttraction && (
          <div className="absolute right-4 bottom-4 left-4 z-20 animate-fade-in-up rounded-lg border border-primary/30 bg-background/95 p-3 shadow-2xl backdrop-blur-md md:right-4 md:bottom-4 md:left-4">
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
                className="mb-2 inline-block rounded-full bg-foreground/10 px-2 py-1 text-foreground/70 text-xs uppercase tracking-wider"
                style={{
                  backgroundColor: `${getCategoryColor(selectedAttraction.category)}20`,
                  color: getCategoryColor(selectedAttraction.category).replace(
                    "0.8",
                    "1"
                  ),
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
