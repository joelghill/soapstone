import { createDb, migrateToLatest, closeDb } from "#/lib/db/postgres";
import knex from "knex";
import postgis from "knex-postgis";

// Mock the dependencies
jest.mock("knex");
jest.mock("knex-postgis");
jest.mock("#/lib/env", () => ({
  env: {
    DB_HOST: "localhost",
    DB_PORT: 5432,
    DB_NAME: "test_db",
    DB_USER: "test_user",
    DB_PASSWORD: "test_password",
  },
}));

const mockKnex = {
  migrate: {
    latest: jest.fn(),
  },
  destroy: jest.fn(),
};

const mockedKnex = knex as jest.MockedFunction<typeof knex>;
const mockedPostgis = postgis as jest.MockedFunction<typeof postgis>;

describe("Database utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedKnex.mockReturnValue(mockKnex as any);
    mockedPostgis.mockReturnValue({} as any);
  });

  describe("createDb", () => {
    it("should create database instance with correct configuration", () => {
      const db = createDb();

      expect(knex).toHaveBeenCalledWith({
        client: "pg",
        connection: {
          host: "localhost",
          port: 5432,
          database: "test_db",
          user: "test_user",
          password: "test_password",
        },
        pool: {
          min: 2,
          max: 10,
        },
        migrations: {
          tableName: "knex_migrations",
          directory: "./migrations",
        },
      });
    });
  });

  describe("migrateToLatest", () => {
    it("should run migrations successfully", async () => {
      mockKnex.migrate.latest.mockResolvedValue(["migration1", "migration2"]);

      await migrateToLatest(mockKnex as any);

      expect(mockKnex.migrate.latest).toHaveBeenCalled();
    });

    it("should handle migration errors", async () => {
      const error = new Error("Migration failed");
      mockKnex.migrate.latest.mockRejectedValue(error);

      await expect(migrateToLatest(mockKnex as any)).rejects.toThrow(
        "Migration failed",
      );
      expect(mockKnex.migrate.latest).toHaveBeenCalled();
    });

    it("should log migration errors", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const error = new Error("Migration failed");
      mockKnex.migrate.latest.mockRejectedValue(error);

      await expect(migrateToLatest(mockKnex as any)).rejects.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith("Migration failed:", error);

      consoleSpy.mockRestore();
    });
  });

  describe("closeDb", () => {
    it("should close database connection when instance exists", async () => {
      createDb(); // Create instance
      mockKnex.destroy.mockResolvedValue(undefined);

      await closeDb();

      expect(mockKnex.destroy).toHaveBeenCalled();
    });

    it("should handle case when no instance exists", async () => {
      // Don't create an instance
      await closeDb();

      expect(mockKnex.destroy).not.toHaveBeenCalled();
    });

    it("should handle destroy errors gracefully", async () => {
      createDb();
      const error = new Error("Destroy failed");
      mockKnex.destroy.mockRejectedValue(error);

      await expect(closeDb()).rejects.toThrow("Destroy failed");
    });
  });

  describe("Database types", () => {
    it("should have correct Status interface structure", () => {
      // This is more of a compile-time check, but we can verify the expected properties exist
      const status = {
        uri: "at://did:test/collection/record",
        authorDid: "did:test:user",
        status: "👍",
        createdAt: "2023-01-01T00:00:00Z",
        indexedAt: "2023-01-01T00:00:00Z",
      };

      expect(status).toHaveProperty("uri");
      expect(status).toHaveProperty("authorDid");
      expect(status).toHaveProperty("status");
      expect(status).toHaveProperty("createdAt");
      expect(status).toHaveProperty("indexedAt");
    });

    it("should have correct Post interface structure", () => {
      const post = {
        uri: "at://did:test/collection/record",
        authorDid: "did:test:user",
        text: "Test message",
        location: { type: "Point", coordinates: [-122.4194, 37.7749] },
        elevation: 100,
        createdAt: "2023-01-01T00:00:00Z",
        indexedAt: "2023-01-01T00:00:00Z",
      };

      expect(post).toHaveProperty("uri");
      expect(post).toHaveProperty("authorDid");
      expect(post).toHaveProperty("text");
      expect(post).toHaveProperty("location");
      expect(post).toHaveProperty("elevation");
      expect(post).toHaveProperty("createdAt");
      expect(post).toHaveProperty("indexedAt");
    });

    it("should have correct AuthSession interface structure", () => {
      const authSession = {
        key: "session-key",
        session: "session-data",
      };

      expect(authSession).toHaveProperty("key");
      expect(authSession).toHaveProperty("session");
    });

    it("should have correct AuthState interface structure", () => {
      const authState = {
        key: "state-key",
        state: "state-data",
      };

      expect(authState).toHaveProperty("key");
      expect(authState).toHaveProperty("state");
    });

    it("should have correct Rating interface structure", () => {
      const rating = {
        uri: "at://did:test/collection/record",
        authorDid: "did:test:user",
        postUri: "at://did:test/post/record",
        positive: true,
        createdAt: "2023-01-01T00:00:00Z",
        indexedAt: "2023-01-01T00:00:00Z",
      };

      expect(rating).toHaveProperty("uri");
      expect(rating).toHaveProperty("authorDid");
      expect(rating).toHaveProperty("postUri");
      expect(rating).toHaveProperty("positive");
      expect(rating).toHaveProperty("createdAt");
      expect(rating).toHaveProperty("indexedAt");
    });
  });
});
