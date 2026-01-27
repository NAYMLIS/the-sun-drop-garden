import { describe, expect, test } from "bun:test";
import {
  calculateTourCenterRotation,
  isRotationCenteredOnNorthAmerica,
} from "./map-utils";

// North American tour dates (same as in scripts/add-tour-dates.ts)
const NORTH_AMERICAN_TOUR_DATES = [
  { city: "Montreal, QC", lat: 45.5017, lng: -73.5673 },
  { city: "Toronto, ON", lat: 43.6532, lng: -79.3832 },
  { city: "New York, NY", lat: 40.7128, lng: -74.006 },
  { city: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  { city: "Miami, FL", lat: 25.7617, lng: -80.1918 },
  { city: "San Francisco, CA", lat: 37.7749, lng: -122.4194 },
  { city: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
];

describe("calculateTourCenterRotation", () => {
  test("returns null for empty array", () => {
    const result = calculateTourCenterRotation([]);
    expect(result).toBeNull();
  });

  test("calculates correct rotation for single date", () => {
    const result = calculateTourCenterRotation([{ lat: 40, lng: -74 }]);
    expect(result).toEqual([74, -40, 0]);
  });

  test("calculates average rotation for multiple dates", () => {
    const dates = [
      { lat: 40, lng: -80 },
      { lat: 50, lng: -100 },
    ];
    const result = calculateTourCenterRotation(dates);
    // Average: lat = 45, lng = -90
    // Rotation: [-lng, -lat, 0] = [90, -45, 0]
    expect(result).toEqual([90, -45, 0]);
  });

  test("calculates rotation for North American tour dates", () => {
    const result = calculateTourCenterRotation(NORTH_AMERICAN_TOUR_DATES);
    expect(result).not.toBeNull();
    // The rotation should center on North America
    if (result) {
      expect(isRotationCenteredOnNorthAmerica(result)).toBe(true);
    }
  });
});

describe("isRotationCenteredOnNorthAmerica", () => {
  test("returns true for rotation centered on central US", () => {
    // Central US: approximately lat 39, lng -98
    // Rotation: [98, -39, 0]
    expect(isRotationCenteredOnNorthAmerica([98, -39, 0])).toBe(true);
  });

  test("returns true for rotation centered on New York", () => {
    // New York: approximately lat 40.7, lng -74
    // Rotation: [74, -40.7, 0]
    expect(isRotationCenteredOnNorthAmerica([74, -40.7, 0])).toBe(true);
  });

  test("returns true for rotation centered on Los Angeles", () => {
    // Los Angeles: approximately lat 34, lng -118
    // Rotation: [118, -34, 0]
    expect(isRotationCenteredOnNorthAmerica([118, -34, 0])).toBe(true);
  });

  test("returns false for default rotation [0, 0, 0] (Atlantic Ocean)", () => {
    expect(isRotationCenteredOnNorthAmerica([0, 0, 0])).toBe(false);
  });

  test("returns false for rotation centered on Europe", () => {
    // London: approximately lat 51.5, lng -0.1
    // Rotation: [0.1, -51.5, 0]
    expect(isRotationCenteredOnNorthAmerica([0.1, -51.5, 0])).toBe(false);
  });

  test("returns false for rotation centered on Asia", () => {
    // Tokyo: approximately lat 35.7, lng 139.7
    // Rotation: [-139.7, -35.7, 0]
    expect(isRotationCenteredOnNorthAmerica([-139.7, -35.7, 0])).toBe(false);
  });

  test("returns false for rotation centered on Australia", () => {
    // Sydney: approximately lat -33.9, lng 151.2
    // Rotation: [-151.2, 33.9, 0]
    expect(isRotationCenteredOnNorthAmerica([-151.2, 33.9, 0])).toBe(false);
  });
});

describe("Tour map initial view", () => {
  test("North American tour dates produce a rotation centered on North America", () => {
    // This is the key test: when we have North American tour dates,
    // the calculated rotation should center the globe on North America
    const rotation = calculateTourCenterRotation(NORTH_AMERICAN_TOUR_DATES);

    expect(rotation).not.toBeNull();
    if (rotation) {
      expect(isRotationCenteredOnNorthAmerica(rotation)).toBe(true);

      // Additional verification: the rotation should NOT be the default [0, 0, 0]
      expect(rotation[0]).not.toBe(0);
      expect(rotation[1]).not.toBe(0);
    }
  });

  test("default rotation [0, 0, 0] is NOT centered on North America", () => {
    // This verifies that if we fail to set the rotation, the map won't show North America
    expect(isRotationCenteredOnNorthAmerica([0, 0, 0])).toBe(false);
  });
});
