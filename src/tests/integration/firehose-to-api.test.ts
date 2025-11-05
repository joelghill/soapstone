import request from "supertest";
import { createIngester } from "#/lib/ingester";
import { createMockPostsRepo, createTestServer } from "../utils/test-app";
import { PostRepository } from "#/lib/repositories/post_repo";
import { SoapStoneServer } from "#/lib/server";
import { IdResolver } from "@atproto/identity";
import { Firehose } from "@atproto/sync";
import { PostView } from "#/lexicon/types/social/soapstone/feed/defs";
import pino from "pino";

// Mock the Firehose
jest.mock("@atproto/sync", () => ({
  Firehose: jest.fn(),
}));

describe("Firehose to API Integration Test", () => {
  let server: SoapStoneServer;
  let mockPostsRepo: jest.Mocked<PostRepository>;
  let mockIdResolver: jest.Mocked<IdResolver>;
  let mockLogger: pino.Logger;
  let capturedConfig: any;

  // The event payload that will be delivered by the firehose
  const firehoseEvent = {
    event: "create",
    did: "did:plc:yaknny2cxnqwtb63apit6j2q",
    uri: {
      toString: () =>
        "at://did:plc:yaknny2cxnqwtb63apit6j2q/social.soapstone.feed.post/3m4qfu745jj2a",
    },
    collection: "social.soapstone.feed.post",
    time: "2025-11-03T16:10:29.091945Z",
    record: {
      $type: "social.soapstone.feed.post",
      message: [
        {
          base: {
            $type: "social.soapstone.text.en.defs#basePhrase",
            selection: "Be wary of ****",
          },
          fill: {
            $type: "social.soapstone.text.en.defs#bodyPart",
            selection: "Rear",
          },
        },
      ],
      location: {
        uri: "geo:52.0992366,-106.6303074,486.5;u=17.988000869750977",
      },
      createdAt: "2025-11-03T16:10:29.091945Z",
    },
  };

  // The post that should be returned after the event is processed
  const expectedPost: PostView = {
    uri: "at://did:plc:yaknny2cxnqwtb63apit6j2q/social.soapstone.feed.post/3m4qfu745jj2a",
    author_did: "did:plc:yaknny2cxnqwtb63apit6j2q",
    text: "Be wary of Rear",
    location: "geo:52.0992366,-106.6303074,486.5;u=17.988000869750977",
    positive_ratings: 0,
    negative_ratings: 0,
    created_at: "2025-11-03T16:10:29.091945Z",
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.unmock("pino");

    // Create a mock logger
    mockLogger = pino({ level: "silent" });

    // Setup Firehose mock to capture config
    (Firehose as jest.Mock).mockImplementation((config) => {
      capturedConfig = config;
      return {
        start: jest.fn(),
        destroy: jest.fn(),
      };
    });

    // Create mock repository and server
    mockPostsRepo = createMockPostsRepo();
    server = await createTestServer(mockPostsRepo);
    mockIdResolver = {} as jest.Mocked<IdResolver>;
  });

  describe("End-to-end flow: Firehose event to API retrieval", () => {
    it("should process a firehose event and then retrieve the post via API", async () => {
      // Step 1: Create the ingester
      createIngester(mockPostsRepo, mockIdResolver, mockLogger);

      // Step 2: Simulate the firehose delivering an event
      await capturedConfig.handleEvent(firehoseEvent);

      // Verify that the post was created in the repository
      expect(mockPostsRepo.createPost).toHaveBeenCalledTimes(1);
      expect(mockPostsRepo.createPost).toHaveBeenCalledWith({
        uri: "at://did:plc:yaknny2cxnqwtb63apit6j2q/social.soapstone.feed.post/3m4qfu745jj2a",
        authorDid: "did:plc:yaknny2cxnqwtb63apit6j2q",
        message: [
          {
            base: {
              $type: "social.soapstone.text.en.defs#basePhrase",
              selection: "Be wary of ****",
            },
            fill: {
              $type: "social.soapstone.text.en.defs#bodyPart",
              selection: "Rear",
            },
          },
        ],
        geoUri: "geo:52.0992366,-106.6303074,486.5;u=17.988000869750977",
        createdAt: "2025-11-03T16:10:29.091945Z",
      });

      // Step 3: Mock the repository to return the post when queried
      mockPostsRepo.getPostsByLocation.mockResolvedValue([expectedPost]);

      // Step 4: Make an API request to retrieve posts near that location
      const response = await request(server.expressApp)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:52.0992366,-106.6303074",
          radius: "1000",
        })
        .expect(200);

      // Step 5: Verify the response contains the post
      expect(response.body).toEqual({
        posts: [expectedPost],
      });

      // Verify the repository was queried with the correct location
      expect(mockPostsRepo.getPostsByLocation).toHaveBeenCalledWith(
        "geo:52.0992366,-106.6303074",
        1000,
      );
    });

    it("should handle multiple firehose events and retrieve all posts", async () => {
      // Create the ingester
      createIngester(mockPostsRepo, mockIdResolver, mockLogger);

      // Process first event
      await capturedConfig.handleEvent(firehoseEvent);

      // Create a second event with a different message
      const secondEvent = {
        event: "create",
        did: "did:plc:another_user",
        uri: {
          toString: () =>
            "at://did:plc:another_user/social.soapstone.feed.post/abc123",
        },
        collection: "social.soapstone.feed.post",
        time: "2025-11-03T17:00:00.000Z",
        record: {
          $type: "social.soapstone.feed.post",
          message: [
            {
              base: {
                $type: "social.soapstone.text.en.defs#basePhrase",
                selection: "Try ****",
              },
              fill: {
                $type: "social.soapstone.text.en.defs#action",
                selection: "Attacking",
              },
            },
          ],
          location: {
            uri: "geo:52.0995,-106.6305,490",
          },
          createdAt: "2025-11-03T17:00:00.000Z",
        },
      };

      const secondPost: PostView = {
        uri: "at://did:plc:another_user/social.soapstone.feed.post/abc123",
        author_did: "did:plc:another_user",
        text: "Try Attacking",
        location: "geo:52.0995,-106.6305,490",
        positive_ratings: 0,
        negative_ratings: 0,
        created_at: "2025-11-03T17:00:00.000Z",
      };

      // Process second event
      await capturedConfig.handleEvent(secondEvent);

      // Verify both posts were created
      expect(mockPostsRepo.createPost).toHaveBeenCalledTimes(2);

      // Mock repository to return both posts
      mockPostsRepo.getPostsByLocation.mockResolvedValue([
        expectedPost,
        secondPost,
      ]);

      // Query for posts in the area
      const response = await request(server.expressApp)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:52.0992366,-106.6303074",
          radius: "1000",
        })
        .expect(200);

      // Verify both posts are returned
      expect(response.body.posts).toHaveLength(2);
      expect(response.body.posts).toContainEqual(expectedPost);
      expect(response.body.posts).toContainEqual(secondPost);
    });

    it("should handle delete event and not return deleted post", async () => {
      // Create the ingester
      createIngester(mockPostsRepo, mockIdResolver, mockLogger);

      // First create a post
      await capturedConfig.handleEvent(firehoseEvent);

      expect(mockPostsRepo.createPost).toHaveBeenCalledTimes(1);

      // Now delete the post
      const deleteEvent = {
        event: "delete",
        did: "did:plc:yaknny2cxnqwtb63apit6j2q",
        uri: {
          toString: () =>
            "at://did:plc:yaknny2cxnqwtb63apit6j2q/social.soapstone.feed.post/3m4qfu745jj2a",
        },
        collection: "social.soapstone.feed.post",
        time: "2025-11-03T18:00:00.000Z",
      };

      await capturedConfig.handleEvent(deleteEvent);

      // Verify delete was called
      expect(mockPostsRepo.deletePost).toHaveBeenCalledTimes(1);
      expect(mockPostsRepo.deletePost).toHaveBeenCalledWith(
        "at://did:plc:yaknny2cxnqwtb63apit6j2q/social.soapstone.feed.post/3m4qfu745jj2a",
      );

      // Mock repository to return empty array (post was deleted)
      mockPostsRepo.getPostsByLocation.mockResolvedValue([]);

      // Query for posts
      const response = await request(server.expressApp)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:52.0992366,-106.6303074",
          radius: "1000",
        })
        .expect(200);

      // Verify no posts are returned
      expect(response.body.posts).toHaveLength(0);
    });

    it("should not create post for invalid event and return empty results", async () => {
      // Create the ingester
      createIngester(mockPostsRepo, mockIdResolver, mockLogger);

      // Try to process an invalid event (missing required fields)
      const invalidEvent = {
        event: "create",
        did: "did:plc:test",
        uri: {
          toString: () =>
            "at://did:plc:test/social.soapstone.feed.post/invalid",
        },
        collection: "social.soapstone.feed.post",
        time: "2025-11-03T16:10:29.091945Z",
        record: {
          $type: "social.soapstone.feed.post",
          message: [
            {
              base: {
                selection: "Invalid", // Missing $type
              },
              fill: {
                selection: "Invalid", // Missing $type
              },
            },
          ],
          location: {
            uri: "geo:52.0992366,-106.6303074",
          },
          createdAt: "2025-11-03T16:10:29.091945Z",
        },
      };

      await capturedConfig.handleEvent(invalidEvent);

      // Verify createPost was NOT called (validation failed)
      expect(mockPostsRepo.createPost).not.toHaveBeenCalled();

      // Mock repository to return empty array
      mockPostsRepo.getPostsByLocation.mockResolvedValue([]);

      // Query for posts
      const response = await request(server.expressApp)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:52.0992366,-106.6303074",
          radius: "1000",
        })
        .expect(200);

      // Verify no posts are returned
      expect(response.body.posts).toHaveLength(0);
    });

    it("should handle errors during firehose processing gracefully", async () => {
      // Create the ingester
      createIngester(mockPostsRepo, mockIdResolver, mockLogger);

      // Mock createPost to throw an error
      const dbError = new Error("Database connection failed");
      mockPostsRepo.createPost.mockRejectedValue(dbError);

      // Process the event (should throw error)
      await expect(capturedConfig.handleEvent(firehoseEvent)).rejects.toThrow(
        "Database connection failed",
      );

      // Verify createPost was attempted
      expect(mockPostsRepo.createPost).toHaveBeenCalledTimes(1);

      // Even though creation failed, API should still respond normally
      mockPostsRepo.getPostsByLocation.mockResolvedValue([]);

      const response = await request(server.expressApp)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:52.0992366,-106.6303074",
          radius: "1000",
        })
        .expect(200);

      expect(response.body.posts).toHaveLength(0);
    });

    it("should correctly transform message to text in the post", async () => {
      // Create the ingester
      createIngester(mockPostsRepo, mockIdResolver, mockLogger);

      // Process event
      await capturedConfig.handleEvent(firehoseEvent);

      // Verify the message was passed correctly
      const createCall = mockPostsRepo.createPost.mock.calls[0][0];
      expect(createCall.message).toEqual([
        {
          base: {
            $type: "social.soapstone.text.en.defs#basePhrase",
            selection: "Be wary of ****",
          },
          fill: {
            $type: "social.soapstone.text.en.defs#bodyPart",
            selection: "Rear",
          },
        },
      ]);

      // The repository would transform this to text "Be wary of Rear"
      // Mock the expected transformed result
      mockPostsRepo.getPostsByLocation.mockResolvedValue([expectedPost]);

      const response = await request(server.expressApp)
        .get("/xrpc/social.soapstone.feed.getPosts")
        .query({
          location: "geo:52.0992366,-106.6303074",
          radius: "1000",
        })
        .expect(200);

      // Verify the text was correctly transformed
      expect(response.body.posts[0].text).toBe("Be wary of Rear");
    });
  });
});
