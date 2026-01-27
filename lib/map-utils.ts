import type { TourDate } from "./types";

/**
 * Calculate the initial rotation for the globe to center on tour dates.
 * Returns [longitude, latitude, roll] where longitude and latitude are negated
 * (D3 orthographic projection convention).
 *
 * @param dates - Array of tour dates with lat/lng coordinates
 * @returns Rotation tuple [-avgLng, -avgLat, 0] or null if no dates
 */
export function calculateTourCenterRotation(
  dates: Pick<TourDate, "lat" | "lng">[]
): [number, number, number] | null {
  if (dates.length === 0) {
    return null;
  }

  const avgLng = dates.reduce((sum, d) => sum + d.lng, 0) / dates.length;
  const avgLat = dates.reduce((sum, d) => sum + d.lat, 0) / dates.length;

  // D3 orthographic projection: negative values rotate the globe to show those coordinates
  return [-avgLng, -avgLat, 0];
}

/**
 * Check if a rotation represents North America (roughly centered on the US).
 * North America spans approximately:
 * - Longitude: -170 to -50 (so negated: 50 to 170)
 * - Latitude: 15 to 85 (so negated: -85 to -15)
 *
 * @param rotation - The rotation tuple [lng, lat, roll]
 * @returns true if the rotation centers on North America
 */
export function isRotationCenteredOnNorthAmerica(
  rotation: [number, number, number]
): boolean {
  const [lng, lat] = rotation;

  // The rotation values are negated, so:
  // - Positive lng means showing western hemisphere
  // - Negative lat means showing northern hemisphere
  const actualLng = -lng;
  const actualLat = -lat;

  // North America bounds (generous)
  const isInLngRange = actualLng >= -140 && actualLng <= -60;
  const isInLatRange = actualLat >= 20 && actualLat <= 60;

  return isInLngRange && isInLatRange;
}
