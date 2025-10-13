import { SoapStoneLexiconHandler } from "../../lib/handlers";
import { ISoapStoneLexiconController } from "../../lib/controllers";
import { OAuthClient } from "@atproto/oauth-client-node";
import pino from "pino";
import express from "express";
import { Agent } from "@atproto/api";
import { getIronSession } from "iron-session";
import {
  Message,
  MessagePart,
} from "../../lexicon/types/social/soapstone/message/defs";
import { Location } from "../../lexicon/types/social/soapstone/location/defs";
import { CreatePostResponse } from "../../lexicon/types/social/soapstone/feed/defs";
import { parseGeoURI } from "../../lib/utils/geo";

// Mock the dependencies
jest.mock("iron-session");
jest.mock("@atproto/oauth-client-node");
jest.mock("@atproto/api");
jest.mock("pino");
jest.mock("../../lib/utils/geo");

const mockGetIronSession = getIronSession as jest.MockedFunction<
  typeof getIronSession
>;
const MockedAgent = Agent as jest.MockedClass<typeof Agent>;
const mockParseGeoURI = parseGeoURI as jest.MockedFunction<typeof parseGeoURI>;

describe("SoapStoneLexiconHandler - createPost", () => {
  let handler: SoapStoneLexiconHandler;
  let mockController: jest.Mocked<ISoapStoneLexiconController>;
  let mockAuth: jest.Mocked<OAuthClient>;
  let mockLogger: jest.Mocked<pino.Logger>;
  let mockReq: Partial<express.Request>;
  let mockRes: Partial<express.Response>;
  let mockNext: jest.Mock;
  let mockAgent: jest.Mocked<Agent>;
  let mockSession: {
    did?: string;
    save: jest.Mock;
    destroy: jest.Mock;
    updateConfig: jest.Mock;
  };

  const sampleMessage: Message = [
    {
      base: {
        $type: "social.soapstone.text.en#basePhrases",
        value: "Try ****",
      },
      fill: { $type: "social.soapstone.text.en#characters", value: "Golem" },
    } as MessagePart,
  ];

  const sampleLocation: Location = {
    uri: "geo:37.7749,-122.4194,10",
  };

  const sampleCreatePostResponse: CreatePostResponse = {
    uri: "at://did:test:user/social.soapstone.feed.post/abc123",
    cid: "bafyreiabc123def456ghi789jkl",
    validationStatus: "valid",
  };

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

    // Mock Agent
    mockAgent = {
      com: {
        atproto: {
          repo: {
            putRecord: jest.fn(),
          },
        },
      },
    } as any;

    // Mock session
    mockSession = {
      did: "did:test:user",
      save: jest.fn(),
      destroy: jest.fn(),
      updateConfig: jest.fn(),
    };

    // Create handler instance
    handler = new SoapStoneLexiconHandler(mockController, mockLogger);

    // Mock Express request and response
    mockReq = {
      params: { methodId: "social.soapstone.feed.createPost" },
      body: {
        message: sampleMessage,
        location: sampleLocation,
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock behaviors
    mockGetIronSession.mockResolvedValue(mockSession as any);
    mockAuth.restore.mockResolvedValue(mockAgent as any);
    mockController.createPost.mockResolvedValue(sampleCreatePostResponse);
    mockController.getPostsByLocation.mockResolvedValue([]);
    mockParseGeoURI.mockReturnValue({
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: undefined,
    });
    MockedAgent.mockImplementation(() => mockAgent);
  });

  describe("handleCatchall - createPost", () => {
    it("should successfully create a post with valid authentication and data", async () => {
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockGetIronSession).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        expect.objectContaining({
          cookieName: "sid",
          password: expect.any(String),
        }),
      );
      expect(mockController.createPost).toHaveBeenCalledWith(
        "did:test:user",
        sampleMessage,
        sampleLocation,
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(sampleCreatePostResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when no session exists", async () => {
      mockSession.did = undefined;

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockGetIronSession).toHaveBeenCalled();
      expect(mockAuth.restore).not.toHaveBeenCalled();
      expect(mockController.createPost).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith("Unauthorized");
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when oauth restore fails", async () => {
      mockAuth.restore.mockResolvedValue(null as any);

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockGetIronSession).toHaveBeenCalled();
      expect(mockController.createPost).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith("Unauthorized");
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle oauth restore throwing an error and destroy session", async () => {
      const oauthError = new Error("OAuth restore failed");
      mockAuth.restore.mockRejectedValue(oauthError);

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockAuth.restore).toHaveBeenCalledWith("did:test:user");
      expect(mockSession.destroy).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { err: oauthError },
        "oauth restore failed",
      );
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith("Unauthorized");
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle missing message in request body", async () => {
      mockReq.body = {
        location: sampleLocation,
      };

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockController.createPost).toHaveBeenCalledWith(
        undefined,
        sampleLocation,
        mockAgent,
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle missing location in request body", async () => {
      mockReq.body = {
        message: sampleMessage,
      };

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockController.createPost).toHaveBeenCalledWith(
        sampleMessage,
        undefined,
        mockAgent,
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle empty request body", async () => {
      mockReq.body = {};

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockController.createPost).toHaveBeenCalledWith(
        undefined,
        undefined,
        mockAgent,
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle controller throwing an error", async () => {
      const controllerError = new Error("Database connection failed");
      mockController.createPost.mockRejectedValue(controllerError);

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockController.createPost).toHaveBeenCalledWith(
        sampleMessage,
        sampleLocation,
        mockAgent,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        { err: controllerError },
        "Error handling catchall request",
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith("Internal Server Error");
    });

    it("should handle getIronSession throwing an error", async () => {
      const sessionError = new Error("Session storage error");
      mockGetIronSession.mockRejectedValue(sessionError);

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockGetIronSession).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        { err: sessionError },
        "Error handling catchall request",
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith("Internal Server Error");
    });

    it("should handle complex message with multiple parts", async () => {
      const complexMessage: Message = [
        {
          base: { $type: "social.soapstone.text.en#basePhrases", value: "Try" },
          fill: {
            $type: "social.soapstone.text.en#techniques",
            value: "magic",
          },
        } as MessagePart,
        {
          base: {
            $type: "social.soapstone.text.en#basePhrases",
            value: "but hole",
          },
          fill: { $type: "social.soapstone.text.en#bodyParts", value: "ahead" },
        } as MessagePart,
      ];

      mockReq.body = {
        message: complexMessage,
        location: sampleLocation,
      };

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockController.createPost).toHaveBeenCalledWith(
        complexMessage,
        sampleLocation,
        mockAgent,
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(sampleCreatePostResponse);
    });

    it("should handle different location formats", async () => {
      const locationWithAltitude: Location = {
        uri: "geo:40.7128,-74.0060,100",
      };

      mockReq.body = {
        message: sampleMessage,
        location: locationWithAltitude,
      };

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockController.createPost).toHaveBeenCalledWith(
        sampleMessage,
        locationWithAltitude,
        mockAgent,
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle location without altitude", async () => {
      const locationWithoutAltitude: Location = {
        uri: "geo:51.5074,-0.1278",
      };

      mockReq.body = {
        message: sampleMessage,
        location: locationWithoutAltitude,
      };

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockController.createPost).toHaveBeenCalledWith(
        sampleMessage,
        locationWithoutAltitude,
        mockAgent,
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle session with null DID", async () => {
      mockSession.did = null as any;

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockGetIronSession).toHaveBeenCalled();
      expect(mockAuth.restore).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith("Unauthorized");
    });

    it("should handle session with empty string DID", async () => {
      mockSession.did = "";

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockGetIronSession).toHaveBeenCalled();
      expect(mockAuth.restore).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith("Unauthorized");
    });

    it("should handle getPosts method correctly", async () => {
      mockReq.params = { methodId: "social.soapstone.feed.getPosts" };
      mockReq.query = { location: "geo:37.7749,-122.4194", radius: "1000" };

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockController.createPost).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle unsupported method ID", async () => {
      mockReq.params = { methodId: "social.soapstone.feed.unsupportedMethod" };

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "Method social.soapstone.feed.unsupportedMethod not implemented",
        }),
      );
    });

    it("should handle controller returning response with different validation status", async () => {
      const responseWithUnknownValidation: CreatePostResponse = {
        ...sampleCreatePostResponse,
        validationStatus: "unknown",
      };
      mockController.createPost.mockResolvedValue(
        responseWithUnknownValidation,
      );

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(responseWithUnknownValidation);
    });

    it("should handle controller returning response with commit metadata", async () => {
      const responseWithCommit: CreatePostResponse = {
        ...sampleCreatePostResponse,
        commit: {
          cid: "bafycommitcid",
          rev: "abc123def456",
        },
      };
      mockController.createPost.mockResolvedValue(responseWithCommit);

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(responseWithCommit);
    });

    it("should maintain session state when oauth restore succeeds", async () => {
      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockSession.destroy).not.toHaveBeenCalled();
      expect(mockAuth.restore).toHaveBeenCalledWith("did:test:user");
      expect(mockController.createPost).toHaveBeenCalled();
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle malformed request body", async () => {
      mockReq.body = "invalid json string";

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockController.createPost).toHaveBeenCalledWith(
        undefined,
        undefined,
        mockAgent,
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle null request body", async () => {
      mockReq.body = null;

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.any(Object),
        "Error handling catchall request",
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith("Internal Server Error");
    });

    it("should handle very large message arrays", async () => {
      const largeMessage: Message = Array.from(
        { length: 100 },
        (_, i) =>
          ({
            base: {
              $type: "social.soapstone.text.en#basePhrases",
              value: `Base ${i}`,
            },
            fill: {
              $type: "social.soapstone.text.en#characters",
              value: `Fill ${i}`,
            },
          }) as MessagePart,
      );

      mockReq.body = {
        message: largeMessage,
        location: sampleLocation,
      };

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockController.createPost).toHaveBeenCalledWith(
        largeMessage,
        sampleLocation,
        mockAgent,
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle concurrent requests with same session", async () => {
      const promises = Array.from({ length: 5 }, () =>
        handler.handleCatchall(
          mockReq as express.Request,
          mockRes as express.Response,
          mockNext,
        ),
      );

      await Promise.all(promises);

      expect(mockGetIronSession).toHaveBeenCalledTimes(5);
      expect(mockAuth.restore).toHaveBeenCalledTimes(5);
      expect(mockController.createPost).toHaveBeenCalledTimes(5);
      expect(mockRes.status).toHaveBeenCalledTimes(5);
    });

    it("should handle authentication edge cases", async () => {
      // Test with malformed DID
      mockSession.did = "invalid-did-format";
      mockAuth.restore.mockRejectedValue(new Error("Invalid DID format"));

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockSession.destroy).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith("Unauthorized");
    });

    it("should handle network timeouts during oauth restore", async () => {
      const timeoutError = new Error("Network timeout");
      timeoutError.name = "TimeoutError";
      mockAuth.restore.mockRejectedValue(timeoutError);

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        { err: timeoutError },
        "oauth restore failed",
      );
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it("should handle agent returning undefined for createPost", async () => {
      mockController.createPost.mockResolvedValue(undefined as any);

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(undefined);
    });

    it("should handle extremely long location URIs", async () => {
      const longLocationURI = "geo:" + "1.234567890123456789".repeat(100);
      const longLocation: Location = {
        uri: longLocationURI,
      };

      mockReq.body = {
        message: sampleMessage,
        location: longLocation,
      };

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockController.createPost).toHaveBeenCalledWith(
        sampleMessage,
        longLocation,
        mockAgent,
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle message with special characters", async () => {
      const specialCharMessage: Message = [
        {
          base: {
            $type: "social.soapstone.text.en#basePhrases",
            value: "Try 🔥",
          },
          fill: {
            $type: "social.soapstone.text.en#techniques",
            value: "attacking 💀",
          },
        } as MessagePart,
      ];

      mockReq.body = {
        message: specialCharMessage,
        location: sampleLocation,
      };

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockController.createPost).toHaveBeenCalledWith(
        specialCharMessage,
        sampleLocation,
        mockAgent,
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle deletePost method ID", async () => {
      mockReq.params = { methodId: "social.soapstone.feed.deletePost" };
      mockReq.body = { uri: "at://did:test:user/posts/123" };

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      // Should not call createPost but should not error either
      expect(mockController.createPost).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should handle rapid successive authentication attempts", async () => {
      const authAttempts = Array.from({ length: 10 }, (_, i) => {
        const req = {
          ...mockReq,
          body: {
            message: [
              {
                base: {
                  $type: "social.soapstone.text.en#basePhrases",
                  value: `Message ${i}`,
                },
                fill: {
                  $type: "social.soapstone.text.en#characters",
                  value: "Test",
                },
              } as MessagePart,
            ],
            location: sampleLocation,
          },
        };
        return handler.handleCatchall(
          req as express.Request,
          mockRes as express.Response,
          mockNext,
        );
      });

      await Promise.all(authAttempts);

      expect(mockGetIronSession).toHaveBeenCalledTimes(10);
      expect(mockAuth.restore).toHaveBeenCalledTimes(10);
      expect(mockController.createPost).toHaveBeenCalledTimes(10);
    });

    it("should handle session restoration with expired tokens", async () => {
      const expiredTokenError = new Error("Token expired");
      expiredTokenError.name = "TokenExpiredError";
      mockAuth.restore.mockRejectedValue(expiredTokenError);

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockSession.destroy).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { err: expiredTokenError },
        "oauth restore failed",
      );
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it("should handle createPost with validation errors", async () => {
      const validationResponse: CreatePostResponse = {
        uri: "at://did:test:user/social.soapstone.feed.post/abc123",
        cid: "bafyreiabc123def456ghi789jkl",
        validationStatus: "unknown",
      };
      mockController.createPost.mockResolvedValue(validationResponse);

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(validationResponse);
    });

    it("should handle requests with undefined methodId", async () => {
      mockReq.params = { methodId: undefined as any };

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Method undefined not implemented",
        }),
      );
    });

    it("should handle message array with mixed valid and invalid parts", async () => {
      const mixedMessage: Message = [
        {
          base: {
            $type: "social.soapstone.text.en#basePhrases",
            value: "Valid",
          },
          fill: {
            $type: "social.soapstone.text.en#characters",
            value: "Message",
          },
        } as MessagePart,
        {
          base: null,
          fill: undefined,
        } as any,
        {
          base: {
            $type: "social.soapstone.text.en#basePhrases",
            value: "Another",
          },
          fill: {
            $type: "social.soapstone.text.en#techniques",
            value: "Valid",
          },
        } as MessagePart,
      ];

      mockReq.body = {
        message: mixedMessage,
        location: sampleLocation,
      };

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockController.createPost).toHaveBeenCalledWith(
        mixedMessage,
        sampleLocation,
        mockAgent,
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle requests with missing params object", async () => {
      mockReq.params = {} as any;

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Method undefined not implemented",
        }),
      );
    });

    it("should handle controller createPost returning Promise rejection", async () => {
      const asyncError = Promise.reject(new Error("Async operation failed"));
      mockController.createPost.mockReturnValue(asyncError);

      await handler.handleCatchall(
        mockReq as express.Request,
        mockRes as express.Response,
        mockNext,
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.any(Error),
        }),
        "Error handling catchall request",
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
