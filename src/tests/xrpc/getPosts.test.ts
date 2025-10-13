import { SoapStoneLexiconHandler } from "../../lib/handlers";
import { ISoapStoneLexiconController } from "../../lib/controllers";
import { OAuthClient } from "@atproto/oauth-client-node";
import pino from "pino";
import express from "express";
import { parseGeoURI } from "../../lib/utils/geo";
import { PostView } from "../../lexicon/types/social/soapstone/feed/defs";

// Mock the dependencies
jest.mock("../../lib/utils/geo");
jest.mock("@atproto/oauth-client-node");
jest.mock("pino");

describe("SoapStoneLexiconHandler - getPosts", () => {
  let handler: SoapStoneLexiconHandler;
  let mockController: jest.Mocked<ISoapStoneLexiconController>;
  let mockAuth: jest.Mocked<OAuthClient>;
  let mockLogger: jest.Mocked<pino.Logger>;
  let mockReq: Partial<express.Request>;
  let mockRes: Partial<express.Response>;
  let mockNext: jest.Mock;
  let mockParseGeoURI: jest.MockedFunction<typeof parseGeoURI>;

  beforeEach(() => {
    // Mock controller
    mockController = {
      getPostsByLocation: jest.fn(),
      createPost: jest.fn(),
      deletePost: jest.fn(),
    } as any;

    // Mock OAuth client
    mockAuth = {
      restore: jest.fn(),
    } as any;

    // Mock logger
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    } as any;

    // Mock parseGeoURI
    mockParseGeoURI = parseGeoURI as jest.MockedFunction<typeof parseGeoURI>;

    // Create handler instance
    handler = new SoapStoneLexiconHandler(mockController, mockLogger);

    // Mock Express request and response
    mockReq = {
      params: { methodId: "social.soapstone.feed.getPosts" },
      query: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe("handleCatchall - getPosts", () => {
    it("should successfully get posts with valid location and default radius", async () => {
      // Arrange
      const mockPosts: PostView[] = [
        {
          uri: "at://did:test:user1/social.soapstone.feed.post/1",
          author_uri: "did:test:user1",
          text: "Test post 1",
          location: "POINT(-122.4194 37.7749)",
          positiveRatingsCount: 5,
          negativeRatingsCount: 1,
          indexedAt: "2023-01-01T00:00:00.000Z",
        },
        {
          uri: "at://did:test:user2/social.soapstone.feed.post/2",
          author_uri: "did:test:user2",
          text: "Test post 2",
          location: "POINT(-122.4195 37.7750)",
          positiveRatingsCount: 3,
          negativeRatingsCount: 2,
          indexedAt: "2023-01-01T01:00:00.000Z",
        },
      ];

      mockReq.query = { location: "geo:37.7749,-122.4194" };
      mockParseGeoURI.mockReturnValue({
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: undefined,
      });
      mockController.getPostsByLocation.mockResolvedValue(mockPosts);

      // Act
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Assert
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.7749,-122.4194",
        undefined,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ posts: mockPosts });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should successfully get posts with custom radius", async () => {
      // Arrange
      const mockPosts: PostView[] = [
        {
          uri: "at://did:test:user1/social.soapstone.feed.post/1",
          author_uri: "did:test:user1",
          text: "Test post 1",
          location: "POINT(-122.4194 37.7749)",
          positiveRatingsCount: 5,
          negativeRatingsCount: 1,
          indexedAt: "2023-01-01T00:00:00.000Z",
        },
      ];

      mockReq.query = { location: "geo:37.7749,-122.4194", radius: "500" };
      mockParseGeoURI.mockReturnValue({
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: undefined,
      });
      mockController.getPostsByLocation.mockResolvedValue(mockPosts);

      // Act
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Assert
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.7749,-122.4194",
        500,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ posts: mockPosts });
    });

    it("should handle location with altitude", async () => {
      // Arrange
      const mockPosts: PostView[] = [];

      mockReq.query = {
        location: "geo:37.7749,-122.4194;u=100.5",
        radius: "1000",
      };
      mockParseGeoURI.mockReturnValue({
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: 100.5,
      });
      mockController.getPostsByLocation.mockResolvedValue(mockPosts);

      // Act
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Assert
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.7749,-122.4194;u=100.5",
        1000,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ posts: mockPosts });
    });

    it("should return empty posts array when no posts found", async () => {
      // Arrange
      mockReq.query = { location: "geo:0,0" };
      mockParseGeoURI.mockReturnValue({
        latitude: 0,
        longitude: 0,
        altitude: undefined,
      });
      mockController.getPostsByLocation.mockResolvedValue([]);

      // Act
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Assert
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "geo:0,0",
        undefined,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ posts: [] });
    });

    it("should handle radius as string and convert to number", async () => {
      // Arrange
      mockReq.query = { location: "geo:37.7749,-122.4194", radius: "250.5" };
      mockParseGeoURI.mockReturnValue({
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: undefined,
      });
      mockController.getPostsByLocation.mockResolvedValue([]);

      // Act
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Assert
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.7749,-122.4194",
        250.5,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ posts: [] });
    });

    it("should handle negative coordinates", async () => {
      // Arrange
      mockReq.query = { location: "geo:-33.8688,151.2093" };
      mockParseGeoURI.mockReturnValue({
        latitude: -33.8688,
        longitude: 151.2093,
        altitude: undefined,
      });
      mockController.getPostsByLocation.mockResolvedValue([]);

      // Act
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Assert
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "geo:-33.8688,151.2093",
        undefined,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ posts: [] });
    });

    it("should handle invalid radius gracefully", async () => {
      // Arrange
      mockReq.query = { location: "geo:37.7749,-122.4194", radius: "invalid" };
      mockParseGeoURI.mockReturnValue({
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: undefined,
      });
      mockController.getPostsByLocation.mockResolvedValue([]);

      // Act
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Assert
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.7749,-122.4194",
        NaN,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ posts: [] });
    });

    it("should handle parseGeoURI throwing an error", async () => {
      // Arrange
      mockReq.query = { location: "invalid-geo-uri" };
      // Mock controller to throw error when called with invalid geo URI
      mockController.getPostsByLocation.mockRejectedValue(
        new Error("Invalid Geo URI"),
      );

      // Act
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Assert
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "invalid-geo-uri",
        undefined,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        "Error handling catchall request",
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith("Internal Server Error");
    });

    it("should handle controller throwing an error", async () => {
      // Arrange
      mockReq.query = { location: "geo:37.7749,-122.4194" };
      mockParseGeoURI.mockReturnValue({
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: undefined,
      });
      mockController.getPostsByLocation.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Assert
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.7749,-122.4194",
        undefined,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        "Error handling catchall request",
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith("Internal Server Error");
    });

    it("should handle missing location parameter", async () => {
      // Arrange
      mockReq.query = {}; // No location parameter
      mockController.getPostsByLocation.mockRejectedValue(
        new Error("Location is required"),
      );

      // Act
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Assert
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        "Error handling catchall request",
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith("Internal Server Error");
    });

    it("should handle zero radius", async () => {
      // Arrange
      mockReq.query = { location: "geo:37.7749,-122.4194", radius: "0" };
      mockParseGeoURI.mockReturnValue({
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: undefined,
      });
      mockController.getPostsByLocation.mockResolvedValue([]);

      // Act
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Assert
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.7749,-122.4194",
        0,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ posts: [] });
    });

    it("should handle posts with all optional fields", async () => {
      // Arrange
      const mockPosts: PostView[] = [
        {
          uri: "at://did:test:user1/social.soapstone.feed.post/1",
          author_uri: "did:test:user1",
          text: "Test post with all fields",
          location: "POINT(-122.4194 37.7749)",
          positiveRatingsCount: 10,
          negativeRatingsCount: 2,
          indexedAt: "2023-01-01T00:00:00.000Z",
          viewer: {
            rating: "positive",
          },
        },
      ];

      mockReq.query = { location: "geo:37.7749,-122.4194" };
      mockParseGeoURI.mockReturnValue({
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: undefined,
      });
      mockController.getPostsByLocation.mockResolvedValue(mockPosts);

      // Act
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ posts: mockPosts });
    });

    it("should handle posts with minimal fields", async () => {
      // Arrange
      const mockPosts: PostView[] = [
        {
          uri: "at://did:test:user1/social.soapstone.feed.post/1",
          author_uri: "did:test:user1",
          text: "Minimal post",
          location: "POINT(-122.4194 37.7749)",
          indexedAt: "2023-01-01T00:00:00.000Z",
        },
      ];

      mockReq.query = { location: "geo:37.7749,-122.4194" };
      mockParseGeoURI.mockReturnValue({
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: undefined,
      });
      mockController.getPostsByLocation.mockResolvedValue(mockPosts);

      // Act
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ posts: mockPosts });
    });

    it("should handle large radius values", async () => {
      // Arrange
      mockReq.query = { location: "geo:37.7749,-122.4194", radius: "1000" };
      mockParseGeoURI.mockReturnValue({
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: undefined,
      });
      mockController.getPostsByLocation.mockResolvedValue([]);

      // Act
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Assert
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.7749,-122.4194",
        1000,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ posts: [] });
    });

    it("should handle method not being getPosts", async () => {
      // Arrange
      mockReq.params = { methodId: "social.soapstone.feed.createPost" };

      // Act
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Assert
      expect(mockParseGeoURI).not.toHaveBeenCalled();
      expect(mockController.getPostsByLocation).not.toHaveBeenCalled();
      // The createPost method will still be called and fail, so status will be called
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith("Internal Server Error");
    });

    it("should handle unsupported method", async () => {
      // Arrange
      mockReq.params = { methodId: "unsupported.method" };

      // Act
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Method unsupported.method not implemented",
        }),
      );
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle very precise coordinates", async () => {
      // Arrange
      mockReq.query = { location: "geo:37.774925,-122.419414" };
      mockParseGeoURI.mockReturnValue({
        latitude: 37.774925,
        longitude: -122.419414,
        altitude: undefined,
      });
      mockController.getPostsByLocation.mockResolvedValue([]);

      // Act
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Assert
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.774925,-122.419414",
        undefined,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should handle boundary coordinates", async () => {
      // Arrange
      mockReq.query = { location: "geo:90,-180" };
      mockParseGeoURI.mockReturnValue({
        latitude: 90,
        longitude: -180,
        altitude: undefined,
      });
      mockController.getPostsByLocation.mockResolvedValue([]);

      // Act
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Assert
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "geo:90,-180",
        undefined,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should handle controller returning null", async () => {
      // Arrange
      mockReq.query = { location: "geo:37.7749,-122.4194" };
      mockParseGeoURI.mockReturnValue({
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: undefined,
      });
      mockController.getPostsByLocation.mockResolvedValue(null as any);

      // Act
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ posts: null });
    });
  });
});
