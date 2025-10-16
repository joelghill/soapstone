import request from "supertest";
import { getIronSession } from "iron-session";
import {
  createTestServer,
  createMockController,
  mockSessionData,
  mockAuthCredentials,
} from "../utils/test-app";
import { ISoapStoneLexiconController } from "../../lib/controllers";
import {
  Message,
  MessagePart,
} from "../../lexicon/types/social/soapstone/message/defs";
import { Location } from "../../lexicon/types/social/soapstone/location/defs";
import { CreatePostResponse } from "../../lexicon/types/social/soapstone/feed/defs";
import { SoapStoneServer } from "#/lib/server";

// Mock iron-session for session management
jest.mock("iron-session");
const mockGetIronSession = getIronSession as jest.MockedFunction<
  typeof getIronSession
>;

describe("XRPC createPost endpoint (supertest)", () => {
  let server: SoapStoneServer;
  let mockController: jest.Mocked<ISoapStoneLexiconController>;
  let mockSession: {
    did?: string;
    save: jest.Mock;
    destroy: jest.Mock;
    updateConfig: jest.Mock;
  };

  const sampleMessage = [
    {
      base: {
        $type: "social.soapstone.text.en.defs#basePhrase",
        selection: "Try ****",
      },
      fill: {
        $type: "social.soapstone.text.en.defs#character",
        selection: "Golem",
      },
    },
  ];

  const sampleLocation: Location = {
    uri: "geo:37.7749,-122.4194,10",
  };

  const sampleCreatePostResponse: CreatePostResponse = {
    uri: "at://did:test:user/social.soapstone.feed.post/abc123",
    cid: "bafyreihyrpefhacm6kkp4ql6j6udakdit7g3dmkzfriqfykhjw6cad5lrm",
    validationStatus: "valid",
  };

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
    mockController.createPost.mockResolvedValue(sampleCreatePostResponse);
  });

  beforeAll((done) => {
    done();
  });

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    server.close();
    done();
  });

  describe("POST /xrpc/social.soapstone.feed.createPost", () => {
    it("should successfully create a post with valid authentication and data", async () => {
      const response = await request(server.app)
        .post("/xrpc/social.soapstone.feed.createPost")
        .send({
          message: sampleMessage,
          location: sampleLocation,
        });

      expect(response.body).toEqual(sampleCreatePostResponse);
      expect(mockController.createPost).toHaveBeenCalledWith(
        mockAuthCredentials.did,
        sampleMessage,
        sampleLocation,
      );
    });

    it("should return 401 when no session exists", async () => {
      mockSession.did = undefined;

      await request(server.app)
        .post("/xrpc/social.soapstone.feed.createPost")
        .send({
          message: sampleMessage,
          location: sampleLocation,
        })
        .expect(401);

      expect(mockController.createPost).not.toHaveBeenCalled();
    });

    it("should handle empty session DID", async () => {
      mockSession.did = "";

      await request(server.app)
        .post("/xrpc/social.soapstone.feed.createPost")
        .send({
          message: sampleMessage,
          location: sampleLocation,
        })
        .expect(401);

      expect(mockController.createPost).not.toHaveBeenCalled();
    });

    it("should handle missing message in request body", async () => {
      const response = await request(server.app)
        .post("/xrpc/social.soapstone.feed.createPost")
        .send({
          location: sampleLocation,
        })
        .expect(400);

      expect(response.body).toEqual({
        error: "InvalidRequest",
        message: 'Input must have the property "message"',
      });
      expect(mockController.createPost).not.toHaveBeenCalled();
    });

    it("should handle missing location in request body", async () => {
      const response = await request(server.app)
        .post("/xrpc/social.soapstone.feed.createPost")
        .send({
          message: sampleMessage,
        })
        .expect(400);

      expect(response.body).toEqual({
        error: "InvalidRequest",
        message: 'Input must have the property "location"',
      });
      expect(mockController.createPost).not.toHaveBeenCalled();
    });

    it("should handle empty request body", async () => {
      const response = await request(server.app)
        .post("/xrpc/social.soapstone.feed.createPost")
        .send({})
        .expect(400);
    });

    it("should handle controller throwing an error", async () => {
      const controllerError = new Error("Database connection failed");
      mockController.createPost.mockRejectedValue(controllerError);

      await request(server.app)
        .post("/xrpc/social.soapstone.feed.createPost")
        .send({
          message: sampleMessage,
          location: sampleLocation,
        })
        .expect(500);

      expect(mockController.createPost).toHaveBeenCalledWith(
        mockAuthCredentials.did,
        sampleMessage,
        sampleLocation,
      );
    });

    it("should handle complex message with multiple parts", async () => {
      const complexMessage = [
        {
          base: {
            $type: "string",
            value: "Try ****",
          },
          fill: { $type: "string", value: "Golem" },
        },
        {
          base: {
            $type: "string",
            value: "Try ****",
          },
          fill: { $type: "string", value: "attacking" },
        },
      ];

      const response = await request(server.app)
        .post("/xrpc/social.soapstone.feed.createPost")
        .send({
          message: complexMessage,
          location: sampleLocation,
        })
        .expect(200);

      expect(response.body).toEqual(sampleCreatePostResponse);
      expect(mockController.createPost).toHaveBeenCalledWith(
        mockAuthCredentials.did,
        complexMessage,
        sampleLocation,
      );
    });

    it("should handle different location formats", async () => {
      const locationWithAltitude: Location = {
        uri: "geo:40.7128,-74.0060,100",
      };

      const response = await request(server.app)
        .post("/xrpc/social.soapstone.feed.createPost")
        .send({
          message: sampleMessage,
          location: locationWithAltitude,
        })
        .expect(200);

      expect(response.body).toEqual(sampleCreatePostResponse);
      expect(mockController.createPost).toHaveBeenCalledWith(
        mockAuthCredentials.did,
        sampleMessage,
        locationWithAltitude,
      );
    });

    it("should handle location without altitude", async () => {
      const locationWithoutAltitude: Location = {
        uri: "geo:51.5074,-0.1278",
      };

      const response = await request(server.app)
        .post("/xrpc/social.soapstone.feed.createPost")
        .send({
          message: sampleMessage,
          location: locationWithoutAltitude,
        })
        .expect(200);

      expect(response.body).toEqual(sampleCreatePostResponse);
      expect(mockController.createPost).toHaveBeenCalledWith(
        mockAuthCredentials.did,
        sampleMessage,
        locationWithoutAltitude,
      );
    });

    it("should handle session error during authentication", async () => {
      const sessionError = new Error("Session storage error");
      mockGetIronSession.mockRejectedValue(sessionError);

      await request(server.app)
        .post("/xrpc/social.soapstone.feed.createPost")
        .send({
          message: sampleMessage,
          location: sampleLocation,
        })
        .expect(401);

      expect(mockController.createPost).not.toHaveBeenCalled();
    });

    it("should handle controller returning response with different validation status", async () => {
      const responseWithUnknownValidation: CreatePostResponse = {
        ...sampleCreatePostResponse,
        validationStatus: "unknown",
      };
      mockController.createPost.mockResolvedValue(
        responseWithUnknownValidation,
      );

      const response = await request(server.app)
        .post("/xrpc/social.soapstone.feed.createPost")
        .send({
          message: sampleMessage,
          location: sampleLocation,
        })
        .expect(200);

      expect(response.body).toEqual(responseWithUnknownValidation);
    });

    it("should handle message with special characters", async () => {
      const specialCharMessage = [
        {
          base: {
            $type: "social.soapstone.text.en.defs#basePhrase",
            selection: "Try 🔥",
          },
          fill: {
            $type: "social.soapstone.text.en.defs#character",
            selection: "attacking 💀",
          },
        },
      ];

      const response = await request(server.app)
        .post("/xrpc/social.soapstone.feed.createPost")
        .send({
          message: specialCharMessage,
          location: sampleLocation,
        })
        .expect(400);
      expect(mockController.createPost).not.toHaveBeenCalled();
    });

    it("should handle message arrays", async () => {
      const largeMessage = Array.from({ length: 2 }, (_, i) => ({
        base: {
          $type: "social.soapstone.text.en.defs#basePhrases",
          value: `Try ****`,
        },
        fill: {
          $type: "social.soapstone.text.en.defs#characters",
          value: `Golem`,
        },
      }));

      const response = await request(server.app)
        .post("/xrpc/social.soapstone.feed.createPost")
        .send({
          message: largeMessage,
          location: sampleLocation,
        })
        .expect(200);

      expect(response.body).toEqual(sampleCreatePostResponse);
      expect(mockController.createPost).toHaveBeenCalledWith(
        mockAuthCredentials.did,
        largeMessage,
        sampleLocation,
      );
    });

    it("should handle invalid JSON in request body", async () => {
      await request(server.app)
        .post("/xrpc/social.soapstone.feed.createPost")
        .send("invalid json")
        .set("Content-Type", "application/json")
        .expect(400); // Express will return 400 for invalid JSON
    });

    it("should handle concurrent requests", async () => {
      const promises = Array.from({ length: 5 }, () =>
        request(server.app)
          .post("/xrpc/social.soapstone.feed.createPost")
          .send({
            message: sampleMessage,
            location: sampleLocation,
          })
          .expect(200),
      );

      const responses = await Promise.all(promises);

      // Verify all responses are correct
      responses.forEach((response) => {
        expect(response.body).toEqual(sampleCreatePostResponse);
      });

      // Verify the controller was called for each request
      expect(mockController.createPost).toHaveBeenCalledTimes(5);
    });
  });
});
