import { createIngester } from "#/lib/ingester";
import { PostRepository } from "#/lib/repositories/post_repo";
import { IdResolver } from "@atproto/identity";
import { Firehose } from "@atproto/sync";
import pino from "pino";

// Mock the Firehose
jest.mock("@atproto/sync", () => ({
  Firehose: jest.fn(),
}));

describe("Ingester", () => {
  let mockPostsRepo: jest.Mocked<PostRepository>;
  let mockIdResolver: jest.Mocked<IdResolver>;
  let mockFirehose: jest.Mocked<Firehose>;
  let mockLogger: pino.Logger;
  let capturedConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Unmock pino to use real implementation
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

    // Create a mock PostRepository
    mockPostsRepo = {
      createPost: jest.fn().mockResolvedValue(undefined),
      deletePost: jest.fn().mockResolvedValue(undefined),
      getPostByUri: jest.fn(),
      createRating: jest.fn(),
      deleteRating: jest.fn(),
      getPostsByLocation: jest.fn(),
    } as any;

    // Create a mock IdResolver
    mockIdResolver = {} as jest.Mocked<IdResolver>;
  });

  describe("handleEvent - create event", () => {
    it("should write a valid post event to the database", async () => {
      createIngester(mockPostsRepo, mockIdResolver, mockLogger);

      const event = {
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

      await capturedConfig.handleEvent(event);

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
    });

    it("should handle a post with multiple message parts", async () => {
      createIngester(mockPostsRepo, mockIdResolver, mockLogger);

      const event = {
        event: "create",
        did: "did:plc:test123",
        uri: {
          toString: () =>
            "at://did:plc:test123/social.soapstone.feed.post/abc123",
        },
        collection: "social.soapstone.feed.post",
        time: "2025-11-04T10:30:00.000Z",
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
            {
              base: {
                $type: "social.soapstone.text.en.defs#basePhrase",
                selection: "Be wary of ****",
              },
              fill: {
                $type: "social.soapstone.text.en.defs#character",
                selection: "Boss",
              },
            },
          ],
          location: {
            uri: "geo:40.7128,-74.0060,10",
          },
          createdAt: "2025-11-04T10:30:00.000Z",
        },
      };

      await capturedConfig.handleEvent(event);

      expect(mockPostsRepo.createPost).toHaveBeenCalledTimes(1);
      expect(mockPostsRepo.createPost).toHaveBeenCalledWith({
        uri: "at://did:plc:test123/social.soapstone.feed.post/abc123",
        authorDid: "did:plc:test123",
        message: expect.arrayContaining([
          expect.objectContaining({
            base: expect.objectContaining({
              $type: "social.soapstone.text.en.defs#basePhrase",
              selection: "Try ****",
            }),
            fill: expect.objectContaining({
              $type: "social.soapstone.text.en.defs#action",
              selection: "Attacking",
            }),
          }),
          expect.objectContaining({
            base: expect.objectContaining({
              $type: "social.soapstone.text.en.defs#basePhrase",
              selection: "Be wary of ****",
            }),
            fill: expect.objectContaining({
              $type: "social.soapstone.text.en.defs#character",
              selection: "Boss",
            }),
          }),
        ]),
        geoUri: "geo:40.7128,-74.0060,10",
        createdAt: "2025-11-04T10:30:00.000Z",
      });
    });

    it("should ignore events from other collections", async () => {
      createIngester(mockPostsRepo, mockIdResolver, mockLogger);

      const event = {
        event: "create",
        did: "did:plc:test123",
        uri: {
          toString: () => "at://did:plc:test123/app.bsky.feed.post/abc123",
        },
        collection: "app.bsky.feed.post",
        time: "2025-11-04T10:30:00.000Z",
        record: {
          $type: "app.bsky.feed.post",
          text: "This is a regular Bluesky post",
        },
      };

      await capturedConfig.handleEvent(event);

      expect(mockPostsRepo.createPost).not.toHaveBeenCalled();
    });

    it("should ignore events with invalid record type", async () => {
      createIngester(mockPostsRepo, mockIdResolver, mockLogger);

      const event = {
        event: "create",
        did: "did:plc:test123",
        uri: {
          toString: () =>
            "at://did:plc:test123/social.soapstone.feed.post/abc123",
        },
        collection: "social.soapstone.feed.post",
        time: "2025-11-04T10:30:00.000Z",
        record: {
          $type: "wrong.type",
          message: "invalid",
        },
      };

      await capturedConfig.handleEvent(event);

      expect(mockPostsRepo.createPost).not.toHaveBeenCalled();
    });

    it("should ignore events with missing required fields", async () => {
      createIngester(mockPostsRepo, mockIdResolver, mockLogger);
      const event = {
        event: "create",
        did: "did:plc:test123",
        uri: {
          toString: () =>
            "at://did:plc:test123/social.soapstone.feed.post/abc123",
        },
        collection: "social.soapstone.feed.post",
        time: "2025-11-04T10:30:00.000Z",
        record: {
          $type: "social.soapstone.feed.post",
          // Missing message and location fields
          createdAt: "2025-11-04T10:30:00.000Z",
        },
      };

      await capturedConfig.handleEvent(event);

      expect(mockPostsRepo.createPost).not.toHaveBeenCalled();
    });
  });

  describe("handleEvent - delete event", () => {
    it("should delete a post when receiving a delete event", async () => {
      createIngester(mockPostsRepo, mockIdResolver, mockLogger);
      const event = {
        event: "delete",
        did: "did:plc:yaknny2cxnqwtb63apit6j2q",
        uri: {
          toString: () =>
            "at://did:plc:yaknny2cxnqwtb63apit6j2q/social.soapstone.feed.post/3m4qfu745jj2a",
        },
        collection: "social.soapstone.feed.post",
        time: "2025-11-04T10:30:00.000Z",
      };

      await capturedConfig.handleEvent(event);

      expect(mockPostsRepo.deletePost).toHaveBeenCalledTimes(1);
      expect(mockPostsRepo.deletePost).toHaveBeenCalledWith(
        "at://did:plc:yaknny2cxnqwtb63apit6j2q/social.soapstone.feed.post/3m4qfu745jj2a",
      );
    });

    it("should ignore delete events from other collections", async () => {
      createIngester(mockPostsRepo, mockIdResolver, mockLogger);
      const event = {
        event: "delete",
        did: "did:plc:test123",
        uri: {
          toString: () => "at://did:plc:test123/app.bsky.feed.post/abc123",
        },
        collection: "app.bsky.feed.post",
        time: "2025-11-04T10:30:00.000Z",
      };

      await capturedConfig.handleEvent(event);

      expect(mockPostsRepo.deletePost).not.toHaveBeenCalled();
    });
  });

  describe("handleEvent - other events", () => {
    it("should ignore update events", async () => {
      createIngester(mockPostsRepo, mockIdResolver, mockLogger);
      const event = {
        event: "update",
        did: "did:plc:test123",
        uri: {
          toString: () =>
            "at://did:plc:test123/social.soapstone.feed.post/abc123",
        },
        collection: "social.soapstone.feed.post",
        time: "2025-11-04T10:30:00.000Z",
      };

      await capturedConfig.handleEvent(event);

      expect(mockPostsRepo.createPost).not.toHaveBeenCalled();
      expect(mockPostsRepo.deletePost).not.toHaveBeenCalled();
    });

    it("should ignore events without a recognized event type", async () => {
      createIngester(mockPostsRepo, mockIdResolver, mockLogger);
      const event = {
        event: "unknown",
        did: "did:plc:test123",
        uri: {
          toString: () =>
            "at://did:plc:test123/social.soapstone.feed.post/abc123",
        },
        collection: "social.soapstone.feed.post",
        time: "2025-11-04T10:30:00.000Z",
      };

      await capturedConfig.handleEvent(event);

      expect(mockPostsRepo.createPost).not.toHaveBeenCalled();
      expect(mockPostsRepo.deletePost).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle database errors when creating a post", async () => {
      const dbError = new Error("Database connection failed");
      mockPostsRepo.createPost.mockRejectedValue(dbError);

      createIngester(mockPostsRepo, mockIdResolver, mockLogger);

      const event = {
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

      // The handler should throw the error up
      await expect(capturedConfig.handleEvent(event)).rejects.toThrow(
        "Database connection failed",
      );
    });

    it("should handle database errors when deleting a post", async () => {
      const dbError = new Error("Database connection failed");
      mockPostsRepo.deletePost.mockRejectedValue(dbError);

      createIngester(mockPostsRepo, mockIdResolver, mockLogger);

      const event = {
        event: "delete",
        did: "did:plc:yaknny2cxnqwtb63apit6j2q",
        uri: {
          toString: () =>
            "at://did:plc:yaknny2cxnqwtb63apit6j2q/social.soapstone.feed.post/3m4qfu745jj2a",
        },
        collection: "social.soapstone.feed.post",
        time: "2025-11-04T10:30:00.000Z",
      };

      // The handler should throw the error up
      await expect(capturedConfig.handleEvent(event)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });
});
