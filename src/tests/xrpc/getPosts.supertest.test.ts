import request from "supertest";
import { createMockPostsRepo, createTestServer } from "../utils/test-app";
import { PostView } from "../../lexicon/types/social/soapstone/feed/defs";
import { SoapStoneServer } from "#/lib/server";

import { PostRepository } from "#/lib/repositories/post_repo";

describe("XRPC getPosts endpoint (supertest)", () => {
  let server: SoapStoneServer;
  let mockPostsRepo: jest.Mocked<PostRepository>;

  const samplePosts: PostView[] = [
    {
      uri: "at://did:test:user1/social.soapstone.feed.post/1",
      cid: "bafyreidfayvfuwqa7qlnopdjiqrxzs6blmoeu4rujcjtnci5beludirz2a",
      author: { did: "did:test:user1", handle: "user1.test" },
      text: "Test post 1",
      location: { uri: "geo:37.7749,-122.4194" },
      likes: 5,
      dislikes: 1,
      discoveries: 6,
      createdAt: "2023-01-01T00:00:00.000Z",
    },
    {
      uri: "at://did:test:user2/social.soapstone.feed.post/2",
      cid: "bafyreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku",
      author: { did: "did:test:user2", handle: "user2.test" },
      text: "Test post 2",
      location: { uri: "geo:37.7750,-122.4195" },
      likes: 3,
      dislikes: 2,
      discoveries: 5,
      createdAt: "2023-01-01T01:00:00.000Z",
    },
  ];

  beforeEach(async () => {
    // Create the test app
    mockPostsRepo = createMockPostsRepo();
    server = await createTestServer(mockPostsRepo);

    // Reset all mocks
    jest.clearAllMocks();

    mockPostsRepo.getPostsByLocation.mockResolvedValue({ posts: samplePosts });
  });

  describe("GET /xrpc/social.soapstone.feed.getPosts", () => {
    it("should successfully get posts with valid authentication and location", async () => {
      const response = await request(server.expressApp)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:37.7749,-122.4194",
        });

      expect(response.body).toEqual({
        posts: samplePosts,
      });
      expect(mockPostsRepo.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.7749,-122.4194",
        undefined,
        50,
        undefined,
      );
    });

    it("should successfully get posts with location and radius", async () => {
      const response = await request(server.expressApp)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:37.7749,-122.4194",
          radius: "500",
        })
        .expect(200);

      expect(response.body).toEqual({
        posts: samplePosts,
      });
      expect(mockPostsRepo.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.7749,-122.4194",
        500,
        50,
        undefined,
      );
    });

    it("should pass limit and cursor through and return the next cursor", async () => {
      mockPostsRepo.getPostsByLocation.mockResolvedValue({
        posts: samplePosts,
        cursor: "next-cursor",
      });

      const response = await request(server.expressApp)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:37.7749,-122.4194",
          limit: "1",
          cursor: "prev-cursor",
        })
        .expect(200);

      expect(response.body).toEqual({
        posts: samplePosts,
        cursor: "next-cursor",
      });
      expect(mockPostsRepo.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.7749,-122.4194",
        undefined,
        1,
        "prev-cursor",
      );
    });

    it("should handle missing location parameter", async () => {
      const response = await request(server.expressApp)
        .get("/xrpc/social.soapstone.feed.getPosts")

        .expect(400);

      expect(mockPostsRepo.getPostsByLocation).not.toHaveBeenCalled();
    });

    it("should handle decimal radius values", async () => {
      const response = await request(server.expressApp)
        .get("/xrpc/social.soapstone.feed.getPosts")

        .query({
          location: "geo:37.7749,-122.4194",
          radius: "250.5",
        })
        .expect(200);

      expect(response.body).toEqual({
        posts: samplePosts,
      });
      expect(mockPostsRepo.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.7749,-122.4194",
        250,
        50,
        undefined,
      );
    });

    it("should handle negative coordinates", async () => {
      const response = await request(server.expressApp)
        .get("/xrpc/social.soapstone.feed.getPosts")

        .query({
          location: "geo:-33.8688,151.2093",
        })
        .expect(200);

      expect(response.body).toEqual({
        posts: samplePosts,
      });
      expect(mockPostsRepo.getPostsByLocation).toHaveBeenCalledWith(
        "geo:-33.8688,151.2093",
        undefined,
        50,
        undefined,
      );
    });

    it("should handle empty posts result", async () => {
      mockPostsRepo.getPostsByLocation.mockResolvedValue({ posts: [] });

      const response = await request(server.expressApp)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:37.7749,-122.4194",
        })
        .expect(200);

      expect(response.body).toEqual({
        posts: [],
      });
      expect(mockPostsRepo.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.7749,-122.4194",
        undefined,
        50,
        undefined,
      );
    });

    it("should handle controller throwing an error", async () => {
      const controllerError = new Error("Database connection failed");
      mockPostsRepo.getPostsByLocation.mockRejectedValue(controllerError);

      await request(server.expressApp)
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
          cid: "bafyreidfayvfuwqa7qlnopdjiqrxzs6blmoeu4rujcjtnci5beludirz2a",
          author: { did: "did:test:user1", handle: "user1.test" },
          text: "Minimal post",
          location: { uri: "geo:37.7749,-122.4194" },
          createdAt: "2023-01-01T00:00:00.000Z",
        },
      ];
      mockPostsRepo.getPostsByLocation.mockResolvedValue({
        posts: minimalPosts,
      });

      const response = await request(server.expressApp)
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
      const response = await request(server.expressApp)
        .get("/xrpc/social.soapstone.feed.getPosts")

        .query({
          location: "geo:37.7749,-122.4194",
          radius: "100000",
        })
        .expect(400);
    });

    it("should handle zero radius", async () => {
      const response = await request(server.expressApp)
        .get("/xrpc/social.soapstone.feed.getPosts")

        .query({
          location: "geo:37.7749,-122.4194",
          radius: "0",
        })
        .expect(400);
    });

    it("should handle very precise coordinates", async () => {
      const response = await request(server.expressApp)
        .get("/xrpc/social.soapstone.feed.getPosts")

        .query({
          location: "geo:37.774925,-122.419414",
        })
        .expect(200);

      expect(response.body).toEqual({
        posts: samplePosts,
      });
      expect(mockPostsRepo.getPostsByLocation).toHaveBeenCalledWith(
        "geo:37.774925,-122.419414",
        undefined,
        50,
        undefined,
      );
    });

    it("should handle boundary coordinates", async () => {
      const response = await request(server.expressApp)
        .get("/xrpc/social.soapstone.feed.getPosts")

        .query({
          location: "geo:90,-180",
        })
        .expect(200);

      expect(response.body).toEqual({
        posts: samplePosts,
      });
      expect(mockPostsRepo.getPostsByLocation).toHaveBeenCalledWith(
        "geo:90,-180",
        undefined,
        50,
        undefined,
      );
    });

    it("should handle invalid radius format", async () => {
      const response = await request(server.expressApp)
        .get("/xrpc/social.soapstone.feed.getPosts")

        .query({
          location: "geo:37.7749,-122.4194",
          radius: "invalid",
        })
        .expect(400);
    });

    it("should handle concurrent requests", async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(server.expressApp)
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
      expect(mockPostsRepo.getPostsByLocation).toHaveBeenCalledTimes(5);
    });

    it("should handle posts with all optional fields", async () => {
      const fullPosts: PostView[] = [
        {
          uri: "at://did:test:user1/social.soapstone.feed.post/1",
          cid: "bafyreidfayvfuwqa7qlnopdjiqrxzs6blmoeu4rujcjtnci5beludirz2a",
          author: { did: "did:test:user1", handle: "user1.test" },
          text: "Full post with all fields",
          location: { uri: "geo:37.7749,-122.4194" },
          likes: 10,
          dislikes: 2,
          discoveries: 15,
          createdAt: "2023-01-01T00:00:00.000Z",
          viewer: undefined,
        },
      ];
      mockPostsRepo.getPostsByLocation.mockResolvedValue({ posts: fullPosts });

      const response = await request(server.expressApp)
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
      const response = await request(server.expressApp)
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
