// File containing Geo URI utilities

/**
 * Parses a Geo URI and returns an object containing the latitude, longitude, and altitude.
 * @param geoURI The URI of a
 * @returns An object containing the latitude, longitude, and altitude.
 */
export function parseGeoURI(geoURI: string): {
  latitude: number;
  longitude: number;
  altitude?: number;
} {
  const match = geoURI.match(
    /^geo:(-?\d+\.\d+),(-?\d+\.\d+)(?:;u=(-?\d+\.\d+))?/,
  );
  if (!match) throw new Error("Invalid Geo URI");
  return {
    latitude: parseFloat(match[1]),
    longitude: parseFloat(match[2]),
    altitude: match[3] ? parseFloat(match[3]) : undefined,
  };
}
