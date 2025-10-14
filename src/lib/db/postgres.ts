import knex, { Knex } from "knex";
import { env } from "#/lib/env";
import {
  Status,
  AuthSession,
  AuthState,
  Post,
  Rating,
} from "#/lib/repositories/entities";

// Database instance
let dbInstance: Database | null = null;

export const createDb = (): Database => {
  if (dbInstance) {
    return dbInstance;
  }
  let connection;
  if (env.DB_URL) {
    console.log("Using DATABASE_URL for database connection");
    connection = env.DB_URL;
  } else {
    console.log(
      `Using individual DB_* env vars for database connection: host=${env.DB_HOST} port=${env.DB_PORT} db=${env.DB_NAME} user=${env.DB_USER}`,
    );
    connection = {
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      ssl: env.DB_CA_CERT
        ? {
            ca: env.DB_CA_CERT,
            rejectUnauthorized: true,
          }
        : undefined,
    } as Knex.PgConnectionConfig;
  }

  const config: Knex.Config = {
    client: "pg",
    connection: connection,
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
