import { parseGeoURI, convertPostGISToGeoURI } from "#/lib/utils/geo";

describe("parseGeoURI", () => {
  it("should parse a basic geo URI with latitude and longitude", () => {
    const result = parseGeoURI("geo:37.7749,-122.4194");

    expect(result).toEqual({
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: undefined,
    });
  });

  it("should parse a geo URI with altitude", () => {
    const result = parseGeoURI("geo:37.7749,-122.4194;u=10.5");

    expect(result).toEqual({
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: 10.5,
    });
  });

  it("should parse a geo URI with negative coordinates", () => {
    const result = parseGeoURI("geo:-33.8688,151.2093");

    expect(result).toEqual({
      latitude: -33.8688,
      longitude: 151.2093,
      altitude: undefined,
    });
  });

  it("should parse a geo URI with negative altitude", () => {
    const result = parseGeoURI("geo:25.7617,-80.1918;u=-2.3");

    expect(result).toEqual({
      latitude: 25.7617,
      longitude: -80.1918,
      altitude: -2.3,
    });
  });

  it("should parse a geo URI with zero coordinates", () => {
    const result = parseGeoURI("geo:0.0,0.0");

    expect(result).toEqual({
      latitude: 0.0,
      longitude: 0.0,
      altitude: undefined,
    });
  });

  it("should parse a geo URI with zero altitude", () => {
    const result = parseGeoURI("geo:40.7128,-74.0060;u=0.0");

    expect(result).toEqual({
      latitude: 40.7128,
      longitude: -74.006,
      altitude: 0.0,
    });
  });

  it("should handle high precision coordinates", () => {
    const result = parseGeoURI("geo:40.712775,-74.005973;u=15.123456");

    expect(result).toEqual({
      latitude: 40.712775,
      longitude: -74.005973,
      altitude: 15.123456,
    });
  });

  it("should throw error for invalid geo URI format", () => {
    expect(() => parseGeoURI("invalid-uri")).toThrow("Invalid Geo URI");
  });

  it("should throw error for missing geo prefix", () => {
    expect(() => parseGeoURI("37.7749,-122.4194")).toThrow("Invalid Geo URI");
  });

  it("should throw error for malformed coordinates", () => {
    expect(() => parseGeoURI("geo:invalid,coordinates")).toThrow(
      "Invalid Geo URI",
    );
  });

  it("should throw error for missing longitude", () => {
    expect(() => parseGeoURI("geo:37.7749")).toThrow("Invalid Geo URI");
  });

  it("should throw error for empty string", () => {
    expect(() => parseGeoURI("")).toThrow("Invalid Geo URI");
  });

  it("should throw error for URI with only geo prefix", () => {
    expect(() => parseGeoURI("geo:")).toThrow("Invalid Geo URI");
  });

  it("should throw error for URI with extra commas", () => {
    const result = parseGeoURI("geo:37.7749,-122.4194,extra");
    expect(result).toEqual({
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: undefined,
    });
  });

  it("should handle URI with spaces (should fail)", () => {
    expect(() => parseGeoURI("geo: 37.7749, -122.4194")).toThrow(
      "Invalid Geo URI",
    );
  });

  it("should handle URI with non-numeric coordinates", () => {
    expect(() => parseGeoURI("geo:abc,-122.4194")).toThrow("Invalid Geo URI");
  });

  it("should handle URI with non-numeric altitude", () => {
    const result = parseGeoURI("geo:37.7749,-122.4194;u=abc");
    expect(result).toEqual({
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: undefined,
    });
  });

  it("should handle very large coordinates", () => {
    const result = parseGeoURI("geo:999.999999,-999.999999;u=9999.999");

    expect(result).toEqual({
      latitude: 999.999999,
      longitude: -999.999999,
      altitude: 9999.999,
    });
  });

  it("should handle very small decimal coordinates", () => {
    const result = parseGeoURI("geo:0.000001,-0.000001;u=0.001");

    expect(result).toEqual({
      latitude: 0.000001,
      longitude: -0.000001,
      altitude: 0.001,
    });
  });
});

describe("convertPostGISToGeoURI", () => {
  it("should convert basic PostGIS POINT to geo URI", () => {
    const result = convertPostGISToGeoURI("POINT(-122.4194 37.7749)");

    expect(result).toBe("geo:37.7749,-122.4194");
  });

  it("should convert PostGIS POINT with elevation to geo URI", () => {
    const result = convertPostGISToGeoURI("POINT(-122.4194 37.7749)", 100.5);

    expect(result).toBe("geo:37.7749,-122.4194,100.5");
  });

  it("should handle negative coordinates", () => {
    const result = convertPostGISToGeoURI("POINT(151.2093 -33.8688)");

    expect(result).toBe("geo:-33.8688,151.2093");
  });

  it("should handle zero coordinates", () => {
    const result = convertPostGISToGeoURI("POINT(0 0)");

    expect(result).toBe("geo:0,0");
  });

  it("should handle elevation of zero", () => {
    const result = convertPostGISToGeoURI("POINT(-122.4194 37.7749)", 0);

    expect(result).toBe("geo:37.7749,-122.4194,0");
  });

  it("should handle null elevation", () => {
    const result = convertPostGISToGeoURI("POINT(-122.4194 37.7749)", null);

    expect(result).toBe("geo:37.7749,-122.4194");
  });

  it("should handle undefined elevation", () => {
    const result = convertPostGISToGeoURI(
      "POINT(-122.4194 37.7749)",
      undefined,
    );

    expect(result).toBe("geo:37.7749,-122.4194");
  });

  it("should return empty string for invalid PostGIS format", () => {
    const result = convertPostGISToGeoURI("INVALID FORMAT");

    expect(result).toBe("");
  });

  it("should handle high precision coordinates", () => {
    const result = convertPostGISToGeoURI("POINT(-122.419414 37.774925)");

    expect(result).toBe("geo:37.774925,-122.419414");
  });
});
