#!/usr/bin/env node

require("dotenv").config();
const knex = require("knex");

const config = {
  client: "pg",
  connection: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "soapstone",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
  },
  pool: {
    min: 1,
    max: 2,
  },
};

async function checkDatabase() {
  let db;
  try {
    console.log("🔍 Checking database connection...");
    console.log(
      `📍 Connecting to: ${config.connection.host}:${config.connection.port}/${config.connection.database}`,
    );

    db = knex(config);

    // Test basic connection with timeout
    const connectionTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Connection timeout")), 10000),
    );

    await Promise.race([db.raw("SELECT 1"), connectionTimeout]);
    console.log("✅ Database connection successful");

    // Check PostgreSQL version
    try {
      const versionResult = await db.raw("SELECT version()");
      const version = versionResult.rows[0].version;
      console.log("📦 PostgreSQL version:", version.split(" ")[1]);
    } catch (error) {
      console.log("⚠️  Could not get PostgreSQL version");
    }

    // Check if PostGIS is available
    try {
      const result = await db.raw("SELECT PostGIS_Version()");
      console.log(
        "✅ PostGIS extension is available:",
        result.rows[0].postgis_version,
      );

      // Test PostGIS functionality
      const geomTest = await db.raw("SELECT ST_Point(0, 0) as point");
      console.log("✅ PostGIS geometry functions working");
    } catch (error) {
      console.log("❌ PostGIS extension not found or not working");
      console.log("   For Docker: This should work automatically");
      console.log(
        '   For manual setup: Run "CREATE EXTENSION postgis;" in your database',
      );
    }

    // Check migration status
    try {
      const migrationExists = await db.schema.hasTable("knex_migrations");
      if (migrationExists) {
        const migrations = await db("knex_migrations")
          .select("*")
          .orderBy("id", "desc");
        if (migrations.length > 0) {
          console.log(
            `✅ Migrations table exists with ${migrations.length} applied migrations`,
          );
          console.log(`   Latest migration: ${migrations[0].name}`);
        }
      } else {
        console.log("❌ No migrations have been run. Run: yarn migrate");
      }
    } catch (error) {
      console.log("⚠️  Could not check migration status");
    }

    // Check tables
    const tables = ["status", "auth_session", "auth_state"];
    let allTablesExist = true;

    for (const table of tables) {
      const exists = await db.schema.hasTable(table);
      if (exists) {
        const count = await db(table).count("* as count");
        console.log(
          `✅ Table '${table}' exists with ${count[0].count} records`,
        );
      } else {
        console.log(`❌ Table '${table}' does not exist`);
        allTablesExist = false;
      }
    }

    if (!allTablesExist) {
      console.log("\n💡 To create missing tables, run: yarn migrate");
    }

    console.log("\n🎉 Database health check completed!");

    // Environment-specific notes
    if (process.env.NODE_ENV === "development") {
      console.log("\n📝 Development Notes:");
      console.log('   - Use "yarn docker:up" to start with Docker');
      console.log(
        "   - pgAdmin available at http://localhost:5050 (admin@example.com / admin)",
      );
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("\nTroubleshooting tips:");

    if (config.connection.host === "postgres") {
      console.error("🐳 Docker environment detected:");
      console.error("   1. Make sure Docker is running: docker --version");
      console.error("   2. Start services: yarn docker:up");
      console.error("   3. Check container status: docker-compose ps");
      console.error("   4. View database logs: docker-compose logs postgres");
    } else {
      console.error("🖥️  Local environment detected:");
      console.error("   1. Make sure PostgreSQL is running");
      console.error("   2. Check your .env file configuration");
      console.error("   3. Ensure the database exists: createdb soapstone");
      console.error("   4. Check user permissions");
      console.error("   5. For PostGIS: install postgresql-contrib postgis");
    }

    process.exit(1);
  } finally {
    if (db) {
      await db.destroy();
    }
  }
}

checkDatabase();
