import { pino } from "pino";
import { SoapStoneServer, AppContext } from "../../lib/server";
import { PostRepository } from "../../lib/repositories/post_repo";
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

// Mock the ingester
jest.mock("../../lib/ingester", () => ({
  createIngester: jest.fn(() => ({
    start: jest.fn(),
    destroy: jest.fn(),
  })),
}));

/**
 * Helper function to create a mock controller with Jest mocks
 */
export function createMockPostsRepo(): jest.Mocked<PostRepository> {
  // Create a mock instance using jest.createMockFromModule pattern
  const mockRepo = Object.create(PostRepository.prototype);

  // Mock all public methods
  mockRepo.createPost = jest.fn();
  mockRepo.deletePost = jest.fn();
  mockRepo.getPostByUri = jest.fn();
  mockRepo.createRating = jest.fn();
  mockRepo.deleteRating = jest.fn();
  mockRepo.getPostsByLocation = jest.fn();

  return mockRepo as jest.Mocked<PostRepository>;
}

/**
 * Test utility to create an Express app using SoapStoneServer.create with mocked dependencies
 * and real handlers for testing XRPC endpoints with supertest
 */
export async function createTestServer(mockPostsRepo: PostRepository) {
  // Create a real logger for testing (using silent level to avoid console output)
  const logger = pino({ level: "silent" });

  // Mock the ingester (Firehose)
  const mockIngester = {
    start: jest.fn(),
    destroy: jest.fn(),
  } as unknown as Firehose;

  // Create the AppContext with our mocked dependencies
  const ctx: AppContext = {
    ingester: mockIngester,
    logger,
    posts_repo: mockPostsRepo,
  };

  // Create the server using the SoapStoneServer.create method
  const server = await SoapStoneServer.create(ctx);

  return server;
}
