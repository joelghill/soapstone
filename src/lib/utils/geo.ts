// File containing Geo URI utilities

/**
 * Error thrown when a Geo URI cannot be parsed. Distinguished from generic
 * errors so request handlers can map malformed client input to a 400 instead
 * of a 500.
 */
export class InvalidGeoURIError extends Error {
  constructor(geoURI: string) {
    super(`Invalid Geo URI: ${geoURI}`);
    this.name = "InvalidGeoURIError";
  }
}

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
  // Per RFC 5870 the fractional part of a coordinate is optional, so integer
  // coordinates (e.g. "geo:0,0" or "geo:37,-122") are valid.
  const match = geoURI.match(
    /^geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:;u=(-?\d+(?:\.\d+)?))?/,
  );
  if (!match) throw new InvalidGeoURIError(geoURI);
  return {
    latitude: parseFloat(match[1]),
    longitude: parseFloat(match[2]),
    altitude: match[3] ? parseFloat(match[3]) : undefined,
  };
}

/**
 * Converts PostGIS POINT text to geo URI format.
 * PostGIS returns POINT(longitude latitude), we need geo:latitude,longitude
 * @param locationText - PostGIS POINT text format
 * @param elevation - Optional elevation/altitude value
 * @returns Geo URI string in format geo:latitude,longitude[,altitude]
 */
export function convertPostGISToGeoURI(
  locationText: string,
  elevation?: number | null,
): string {
  const locationMatch = locationText.match(/POINT\(([^\s]+)\s+([^\)]+)\)/);
  if (!locationMatch) {
    return "";
  }

  const longitude = locationMatch[1];
  const latitude = locationMatch[2];
  let geoUri = `geo:${latitude},${longitude}`;

  // Add altitude if available
  if (elevation !== null && elevation !== undefined) {
    geoUri += `,${elevation}`;
  }

  return geoUri;
}
