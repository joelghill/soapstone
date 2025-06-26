import knex, { Knex } from "knex";
import postgis from "knex-postgis";
import { env } from "#/lib/env";

// Types
export interface Status {
  uri: string;
  authorDid: string;
  status: string;
  createdAt: string;
  indexedAt: string;
}

export interface Post {
  uri: string;
  authorDid: string;
  text: string;
  location: GeoJSON.Point;
  elevation: number | null;
  createdAt: string;
  indexedAt: string;
}

export interface AuthSession {
  key: string;
  session: string;
}

export interface AuthState {
  key: string;
  state: string;
}

export interface Rating {
  uri: string;
  authorDid: string;
  postUri: string;
  positive: boolean;
  createdAt: string;
  indexedAt: string;
}

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

export type Database = Knex<Status & AuthSession & AuthState & Rating>;
