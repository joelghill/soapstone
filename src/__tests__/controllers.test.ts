import { mocked } from "jest-mock";
import knex from "knex";
import { Agent } from "@atproto/api";
import { SoapStoneLexiconController } from "../lib/controllers";
import { Database } from "../lib/db";
import { MockClient, Tracker, createTracker } from "knex-mock-client";
import postgis, { KnexPostgis } from "knex-postgis";

import { ComAtprotoRepoPutRecord } from "@atproto/api/";
import {
  Message,
  MessagePart,
} from "#/lexicon/types/social/soapstone/message/defs";
import { Location } from "#/lexicon/types/social/soapstone/location/defs";
import { SessionManager } from "@atproto/api/src/session-manager";

// Create a mock function that we can reference
const mockPutRecord = jest.fn();

// Mock the Agent class from @atproto/api
jest.mock("@atproto/api");

describe("SoapStoneLexiconController", () => {
  // Mock the Agent class
  const MockedAgent = mocked(Agent);

  let controller: SoapStoneLexiconController;
  let mockDb: Database;
  let mockSt: any;
  let mockAgent: Agent;
  let tracker: Tracker;

  beforeEach(() => {
    // Clear previous mocks
    mockPutRecord.mockClear();
    MockedAgent.mockClear();

    // Mock the Agent implementation
    MockedAgent.mockImplementation((options: any) => {
      return {
        appLabelers: [],
        com: {
          atproto: {
            repo: {
              putRecord: mockPutRecord,
            },
          },
        },
        assertDid: "did:test:user",
      } as any;
    });

    mockDb = knex({ client: MockClient });
    tracker = createTracker(mockDb);
    mockSt = postgis(mockDb) as KnexPostgis;

    // Construct the controller with mocked dependencies
    // Mock the SessionManager as it is required by the Agent constructor
    mockAgent = new Agent({} as SessionManager);

    controller = new SoapStoneLexiconController(mockDb, mockSt, mockAgent);
  });

  afterEach(() => {
    tracker.reset();
    // Reset mocks after each test
    jest.clearAllMocks();
  });

  describe("getPostsByLocation", () => {
    it("should return posts within the specified location and radius", async () => {
      // Mock database responses
      const mockPosts = [
        {
          uri: "at://did:test/posts/1",
          author_did: "did:test:user1",
          text: "Test post 1",
          location_text: "POINT(-122.4194 37.7749)",
          created_at: new Date("2023-01-01T00:00:00Z"),
          indexed_at: new Date("2023-01-01T00:00:00Z"),
        },
        {
          uri: "at://did:test/posts/2",
          author_did: "did:test:user2",
          text: "Test post 2",
          location_text: "POINT(-122.4195 37.7750)",
          created_at: new Date("2023-01-01T01:00:00Z"),
          indexed_at: new Date("2023-01-01T01:00:00Z"),
        },
      ];

      const mockRatings = [
        {
          post_uri: "at://did:test/posts/1",
          positive_count: "5",
          negative_count: "1",
        },
        {
          post_uri: "at://did:test/posts/2",
          positive_count: "3",
          negative_count: "2",
        },
      ];

      tracker.on.select(/select "post".*/).response(mockPosts);
      tracker.on.select(/select "post_uri".*/).response(mockRatings);

      const result = await controller.getPostsByLocation(
        37.7749,
        -122.4194,
        undefined,
        1000,
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        uri: "at://did:test/posts/1",
        author_uri: "did:test:user1",
        text: "Test post 1",
        location: "POINT(-122.4194 37.7749)",
        positiveRatingsCount: 5,
        negativeRatingsCount: 1,
        indexedAt: "2023-01-01T00:00:00.000Z",
      });
      expect(result[1]).toMatchObject({
        uri: "at://did:test/posts/2",
        author_uri: "did:test:user2",
        text: "Test post 2",
        location: "POINT(-122.4195 37.7750)",
        positiveRatingsCount: 3,
        negativeRatingsCount: 2,
        indexedAt: "2023-01-01T01:00:00.000Z",
      });
    });
  });

  describe("createPost", () => {
    it("should create a post successfully", async () => {
      const message: Message = [
        {
          base: "Be wary of ****",
          fill: "Enemy",
        } as MessagePart,
      ];
      const location: Location = { uri: "geo:37.7749,-122.4194" };

      const mockPutRecord: ComAtprotoRepoPutRecord.Response = {
        success: true,
        headers: {},
        data: {
          uri: "at://did:test/posts/123",
          cid: "bafyreicid123",
        },
      };
      (mockAgent.com.atproto.repo.putRecord as any).mockResolvedValue(
        await mockPutRecord,
      );

      const result = await controller.createPost(message, location);

      expect(result).toEqual({
        uri: "at://did:test/posts/123",
        cid: "bafyreicid123",
        validationStatus: "valid",
      });

      expect(mockAgent.com.atproto.repo.putRecord).toHaveBeenCalledWith({
        repo: "did:test:user",
        collection: "social.soapstone.feed.post",
        rkey: expect.any(String),
        record: expect.objectContaining({
          $type: "social.soapstone.feed.post",
          message: message,
          location: location,
          createdAt: expect.any(String),
        }),
        validate: false,
      });
    });

    // it("should handle database insertion errors gracefully", async () => {
    //   const mockMessage = [
    //     {
    //       base: "Be wary of ****",
    //       fill: "Hollow",
    //     },
    //   ];
    //   const mockLocation = { uri: "geo:40.7128,-74.0060" };

    //   const mockPutRecord = jest.fn().mockResolvedValue({
    //     data: {
    //       uri: "at://did:test/posts/456",
    //       cid: "bafyreicid456",
    //     },
    //   });

    //   const mockInsert = jest
    //     .fn()
    //     .mockRejectedValue(new Error("Database error"));

    //   mockAgent.com = {
    //     atproto: {
    //       repo: {
    //         putRecord: mockPutRecord,
    //       },
    //     },
    //   };
    //   mockAgent.assertDid = "did:test:user";

    //   mockDb.mockImplementation((table: string) => {
    //     if (table === "post") {
    //       return {
    //         insert: mockInsert,
    //       };
    //     }
    //     return mockDb;
    //   });

    //   mockDb.raw = jest.fn().mockReturnValue("mock_geom");

    //   // Should still succeed even if database insert fails
    //   const result = await controller.createPost(
    //     mockMessage as any,
    //     mockLocation as any,
    //   );

    //   expect(result).toEqual({
    //     uri: "at://did:test/posts/456",
    //     cid: "bafyreicid456",
    //     validationStatus: "valid",
    //   });
    // });

    // it("should fail if PDS write fails", async () => {
    //   const mockMessage = [
    //     {
    //       base: "Need ****",
    //       fill: "Soldier",
    //     },
    //   ];
    //   const mockLocation = { uri: "geo:34.0522,-118.2437" };

    //   const mockPutRecord = jest.fn().mockRejectedValue(new Error("PDS error"));

    //   mockAgent.com = {
    //     atproto: {
    //       repo: {
    //         putRecord: mockPutRecord,
    //       },
    //     },
    //   };
    //   mockAgent.assertDid = "did:test:user";

    //   await expect(
    //     controller.createPost(mockMessage as any, mockLocation as any),
    //   ).rejects.toThrow("Failed to write post record: Error: PDS error");
    // });
  });
});
