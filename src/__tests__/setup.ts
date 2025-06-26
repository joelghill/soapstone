// Jest setup file for global test configuration

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.HOST = "localhost";
process.env.PORT = "3000";
process.env.PUBLIC_URL = "http://localhost:3000";
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";
process.env.DB_NAME = "soapstone_test";
process.env.DB_USER = "postgres";
process.env.DB_PASSWORD = "test_password";
process.env.COOKIE_SECRET = "00000000000000000000000000000000";

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock external dependencies that require network/database connections
jest.mock("@atproto/oauth-client-node", () => ({
  NodeOAuthClient: jest.fn().mockImplementation(() => ({
    clientMetadata: {
      client_name: "Test App",
      client_id: "test-client-id",
    },
    authorize: jest.fn().mockResolvedValue(new URL("http://test.com/auth")),
    callback: jest
      .fn()
      .mockResolvedValue({ session: { did: "did:test:user" } }),
    restore: jest.fn().mockResolvedValue({ did: "did:test:user" }),
  })),
}));

jest.mock("@atproto/sync", () => ({
  Firehose: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    destroy: jest.fn(),
  })),
}));

jest.mock("@atproto/identity", () => ({
  IdResolver: jest.fn().mockImplementation(() => ({
    did: {
      resolveAtprotoData: jest.fn().mockResolvedValue({
        handle: "test.bsky.social",
      }),
    },
    handle: {
      resolve: jest.fn().mockResolvedValue("did:test:user"),
    },
  })),
  MemoryCache: jest.fn(),
}));

// Mock Knex database
const mockKnex = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  del: jest.fn().mockReturnThis(),
  first: jest.fn().mockResolvedValue(null),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  onConflict: jest.fn().mockReturnThis(),
  merge: jest.fn().mockReturnThis(),
  withSchema: jest.fn().mockReturnThis(),
  migrate: {
    latest: jest.fn().mockResolvedValue([]),
  },
  destroy: jest.fn().mockResolvedValue(undefined),
};

jest.mock("knex", () => {
  return jest.fn(() => mockKnex);
});

jest.mock("knex-postgis", () => {
  return jest.fn(() => ({}));
});

// Export mocks for use in tests
export { mockKnex };
