import request from "supertest";
import { Application } from "express";
import { getIronSession } from "iron-session";
import {
  createTestServer,
  createMockController,
  mockSessionData,
  mockAuthCredentials,
} from "../utils/test-app";
import { ISoapStoneLexiconController } from "../../lib/controllers";
import { PostView } from "../../lexicon/types/social/soapstone/feed/defs";
import { SoapStoneServer } from "#/lib/server";

// Mock iron-session for session management
jest.mock("iron-session");
const mockGetIronSession = getIronSession as jest.MockedFunction<
  typeof getIronSession
>;

describe("XRPC getPosts endpoint (supertest)", () => {
  let server: SoapStoneServer;
  let mockController: jest.Mocked<ISoapStoneLexiconController>;
  let mockSession: {
    did?: string;
    save: jest.Mock;
    destroy: jest.Mock;
    updateConfig: jest.Mock;
  };

  const samplePosts: PostView[] = [
    {
      uri: "at://did:test:user1/social.soapstone.feed.post/1",
      author_uri: "at://did:test:user1",
      text: "Test post 1",
      location: "geo:37.7749,-122.4194",
      positiveRatingsCount: 5,
      negativeRatingsCount: 1,
      indexedAt: "2023-01-01T00:00:00.000Z",
    },
    {
      uri: "at://did:test:user2/social.soapstone.feed.post/2",
      author_uri: "at://did:test:user2",
      text: "Test post 2",
      location: "geo:37.7750,-122.4195",
      positiveRatingsCount: 3,
      negativeRatingsCount: 2,
      indexedAt: "2023-01-01T01:00:00.000Z",
    },
  ];

  beforeEach(async () => {
    // Create mocked controller
    mockController = createMockController();

    // Create the test app
    server = await createTestServer(mockController);

    // Mock session
    mockSession = {
      did: mockSessionData.did,
      save: jest.fn(),
      destroy: jest.fn(),
      updateConfig: jest.fn(),
    };

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock behaviors
    mockGetIronSession.mockResolvedValue(mockSession as any);
    mockController.getPostsByLocation.mockResolvedValue(samplePosts);
  });

  describe("GET /xrpc/social.soapstone.feed.getPosts", () => {
    it("should successfully get posts with valid authentication and location", async () => {
      const response = await request(server.app)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:37.7749,-122.4194",
        })
        .expect(200);

      expect(response.body).toEqual({
        posts: samplePosts,
      });
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.7749,-122.4194",
        undefined,
      );
    });

    it("should successfully get posts with location and radius", async () => {
      const response = await request(server.app)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:37.7749,-122.4194",
          radius: "500",
        })
        .expect(200);

      expect(response.body).toEqual({
        posts: samplePosts,
      });
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.7749,-122.4194",
        500,
      );
    });

    it("should return 401 when no session exists", async () => {
      mockSession.did = undefined;

      await request(server.app)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:37.7749,-122.4194",
        })
        .expect(401);

      expect(mockController.getPostsByLocation).not.toHaveBeenCalled();
    });

    it("should handle empty session DID", async () => {
      mockSession.did = "";

      await request(server.app)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:37.7749,-122.4194",
        })
        .expect(401);

      expect(mockController.getPostsByLocation).not.toHaveBeenCalled();
    });

    it("should handle missing location parameter", async () => {
      const response = await request(server.app)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .expect(400);

      expect(mockController.getPostsByLocation).not.toHaveBeenCalled();
    });

    it("should handle decimal radius values", async () => {
      const response = await request(server.app)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:37.7749,-122.4194",
          radius: "250.5",
        })
        .expect(200);

      expect(response.body).toEqual({
        posts: samplePosts,
      });
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.7749,-122.4194",
        250,
      );
    });

    it("should handle negative coordinates", async () => {
      const response = await request(server.app)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:-33.8688,151.2093",
        })
        .expect(200);

      expect(response.body).toEqual({
        posts: samplePosts,
      });
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "geo:-33.8688,151.2093",
        undefined,
      );
    });

    it("should handle empty posts result", async () => {
      mockController.getPostsByLocation.mockResolvedValue([]);

      const response = await request(server.app)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:37.7749,-122.4194",
        })
        .expect(200);

      expect(response.body).toEqual({
        posts: [],
      });
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.7749,-122.4194",
        undefined,
      );
    });

    it("should handle controller throwing an error", async () => {
      const controllerError = new Error("Database connection failed");
      mockController.getPostsByLocation.mockRejectedValue(controllerError);

      await request(server.app)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:37.7749,-122.4194",
        })
        .expect(500);
    });

    it("should handle posts with minimal fields", async () => {
      const minimalPosts: PostView[] = [
        {
          uri: "at://did:test:user1/social.soapstone.feed.post/1",
          author_uri: "at://did:test:user1",
          text: "Minimal post",
          location: "geo:37.7749,-122.4194",
          indexedAt: "2023-01-01T00:00:00.000Z",
        },
      ];
      mockController.getPostsByLocation.mockResolvedValue(minimalPosts);

      const response = await request(server.app)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:37.7749,-122.4194",
        })
        .expect(200);

      expect(response.body).toEqual({
        posts: minimalPosts,
      });
    });

    it("should handle large radius values", async () => {
      const response = await request(server.app)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:37.7749,-122.4194",
          radius: "100000",
        })
        .expect(400);
    });

    it("should handle zero radius", async () => {
      const response = await request(server.app)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:37.7749,-122.4194",
          radius: "0",
        })
        .expect(400);
    });

    it("should handle very precise coordinates", async () => {
      const response = await request(server.app)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:37.774925,-122.419414",
        })
        .expect(200);

      expect(response.body).toEqual({
        posts: samplePosts,
      });
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.774925,-122.419414",
        undefined,
      );
    });

    it("should handle boundary coordinates", async () => {
      const response = await request(server.app)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:90,-180",
        })
        .expect(200);

      expect(response.body).toEqual({
        posts: samplePosts,
      });
      expect(mockController.getPostsByLocation).toHaveBeenCalledWith(
        "geo:90,-180",
        undefined,
      );
    });

    it("should handle session error during authentication", async () => {
      const sessionError = new Error("Session storage error");
      mockGetIronSession.mockRejectedValue(sessionError);

      await request(server.app)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:37.7749,-122.4194",
        })
        .expect(401);

      expect(mockController.getPostsByLocation).not.toHaveBeenCalled();
    });

    it("should handle invalid radius format", async () => {
      const response = await request(server.app)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:37.7749,-122.4194",
          radius: "invalid",
        })
        .expect(400);
    });

    it("should handle concurrent requests", async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(server.app)
          .get("/xrpc/social.soapstone.feed.getPosts")
          .query({
            location: `geo:37.${7749 + i},-122.4194`,
            radius: "1000",
          })
          .expect(200),
      );

      const responses = await Promise.all(promises);

      // Verify all responses are correct
      responses.forEach((response) => {
        expect(response.body).toEqual({
          posts: samplePosts,
        });
      });

      // Verify the controller was called for each request
      expect(mockController.getPostsByLocation).toHaveBeenCalledTimes(5);
    });

    it("should handle posts with all optional fields", async () => {
      const fullPosts: PostView[] = [
        {
          uri: "at://did:test:user1/social.soapstone.feed.post/1",
          author_uri: "at://did:test:user1",
          text: "Full post with all fields",
          location: "geo:37.7749,-122.4194",
          positiveRatingsCount: 10,
          negativeRatingsCount: 2,
          indexedAt: "2023-01-01T00:00:00.000Z",
        },
      ];
      mockController.getPostsByLocation.mockResolvedValue(fullPosts);

      const response = await request(server.app)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:37.7749,-122.4194",
        })
        .expect(200);

      expect(response.body).toEqual({
        posts: fullPosts,
      });
    });

    it("should preserve Content-Type header", async () => {
      const response = await request(server.app)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:37.7749,-122.4194",
        })
        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.body).toEqual({
        posts: samplePosts,
      });
    });
  });
});
