import knex, { Knex } from "knex";
import postgis from "knex-postgis";
import { env } from "#/lib/env";
import { Status, AuthSession, AuthState, Post, Rating } from "#/lib/entities";

// Database instance
let dbInstance: Database | null = null;

export const createDb = (): Database => {
  if (dbInstance) {
    return dbInstance;
  }

  const config: Knex.Config = {
    client: "pg",
    connection: {
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./migrations",
    },
  };

  dbInstance = knex(config);

  // Attach PostGIS functions
  const st = postgis(dbInstance);

  return dbInstance;
};

export const migrateToLatest = async (db: Database) => {
  try {
    await db.migrate.latest();
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
};

export const closeDb = async () => {
  if (dbInstance) {
    await dbInstance.destroy();
    dbInstance = null;
  }
};

export type Database = Knex<Status & AuthSession & AuthState & Rating & Post>;
