import { pino } from "pino";
import { SoapStoneServer, AppContext } from "../../lib/server";
import { ISoapStoneLexiconController } from "../../lib/controllers";
import { SoapStoneLexiconHandler } from "../../lib/handlers";
import { PostRepository } from "../../lib/repositories/post_repo";
import {
  createBidirectionalResolver,
  createIdResolver,
} from "../../lib/id-resolver";
import { OAuthClient } from "@atproto/oauth-client-node";
import { Firehose } from "@atproto/sync";

// Mock the database imports to prevent real database connections
jest.mock("../../lib/db/postgres", () => ({
  createDb: jest.fn(() => ({
    // Mock knex instance
    schema: {
      hasTable: jest.fn().mockResolvedValue(true),
    },
    migrate: {
      latest: jest.fn().mockResolvedValue([]),
    },
    destroy: jest.fn().mockResolvedValue(undefined),
  })),
  migrateToLatest: jest.fn().mockResolvedValue(undefined),
}));

// Mock knex-postgis
jest.mock("knex-postgis", () => {
  return jest.fn(() => ({
    // Mock PostGIS functions
    st: {
      geomFromText: jest.fn(),
      distance: jest.fn(),
    },
  }));
});

// Mock the auth client creation
jest.mock("../../lib/auth/client", () => ({
  createClient: jest.fn().mockResolvedValue({
    clientMetadata: {
      client_id: "test-client",
      client_name: "Test Client",
      redirect_uris: ["http://localhost:3000/oauth/callback"],
    },
    restore: jest.fn(),
    authorize: jest.fn(),
  }),
}));

// Mock the ingester
jest.mock("../../lib/ingester", () => ({
  createIngester: jest.fn(() => ({
    start: jest.fn(),
    destroy: jest.fn(),
  })),
}));

/**
 * Test utility to create an Express app using SoapStoneServer.create with mocked dependencies
 * and real handlers for testing XRPC endpoints with supertest
 */
export async function createTestServer(
  mockController: ISoapStoneLexiconController,
) {
  // Create a real logger for testing (using silent level to avoid console output)
  const logger = pino({ level: "silent" });

  // Create a real handler instance with mocked controller
  const handler = new SoapStoneLexiconHandler(mockController, logger);

  // Mock the ingester (Firehose)
  const mockIngester = {
    start: jest.fn(),
    destroy: jest.fn(),
  } as unknown as Firehose;

  // Mock the OAuth client
  const mockOAuthClient = {
    clientMetadata: {
      client_id: "test-client",
      client_name: "Test Client",
      redirect_uris: ["http://localhost:3000/oauth/callback"],
    },
    restore: jest.fn(),
    authorize: jest.fn(),
  } as unknown as OAuthClient;

  // Mock the resolver
  const baseIdResolver = createIdResolver();
  const resolver = createBidirectionalResolver(baseIdResolver);

  // Mock the posts repository
  const mockPostsRepo = {
    getPostsByLocation: jest.fn(),
    createPost: jest.fn(),
  } as unknown as PostRepository;

  // Create the AppContext with our mocked dependencies
  const ctx: AppContext = {
    controller: mockController,
    handler,
    ingester: mockIngester,
    logger,
    oauthClient: mockOAuthClient,
    resolver,
    posts_repo: mockPostsRepo,
  };

  // Create the server using the SoapStoneServer.create method
  const server = await SoapStoneServer.create(ctx);

  return server;
}

/**
 * Helper function to create a mock controller with Jest mocks
 */
export function createMockController(): jest.Mocked<ISoapStoneLexiconController> {
  return {
    decodeJWT: jest.fn(),
    getPostsByLocation: jest.fn(),
    createPost: jest.fn(),
  } as jest.Mocked<ISoapStoneLexiconController>;
}

/**
 * Mock session data for testing authenticated requests
 */
export const mockSessionData = {
  did: "did:test:user",
};

/**
 * Mock authentication credentials for handler context
 */
export const mockAuthCredentials = {
  did: "did:test:user",
};

/**
 * Mock JWT payload for testing authenticated requests
 */
export const mockJwtPayload = {
  sub: "did:test:user",
  iss: "https://bsky.social",
  aud: "did:test:client",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
};

/**
 * Generate a mock JWT token for testing
 */
export function generateMockJwt(): string {
  // Create a simple mock JWT token (header.payload.signature)
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(JSON.stringify(mockJwtPayload)).toString(
    "base64url",
  );
  const signature = "mock-signature";
  return `${header}.${payload}.${signature}`;
}

/**
 * Generate an Authorization header with Bearer token for testing
 */
export function getMockAuthHeader(): string {
  return `Bearer ${generateMockJwt()}`;
}
