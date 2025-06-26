/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.all([
    // Status table
    knex.schema.createTable("status", (table) => {
      table.string("uri").primary();
      table.string("author_did").notNullable();
      table.string("status").notNullable();
      table.timestamp("created_at").notNullable();
      table.timestamp("indexed_at").notNullable();

      table.index(["author_did"]);
      table.index(["created_at"]);
    }),

    // Post table
    knex.schema.createTable("post", (table) => {
      table.string("uri").primary();
      table.string("author_did").notNullable();
      table.text("text").notNullable();
      table.specificType("location", "geometry(POINT, 4326)").notNullable();
      table.float("elevation");
      table.timestamp("created_at").notNullable();
      table.timestamp("indexed_at").notNullable();

      table.index(["author_did"]);
      table.index(["created_at"]);
      table.spatialIndex("location");
    }),

    // Auth session table
    knex.schema.createTable("auth_session", (table) => {
      table.string("key").primary();
      table.text("session").notNullable();
    }),

    // Auth state table
    knex.schema.createTable("auth_state", (table) => {
      table.string("key").primary();
      table.text("state").notNullable();
    }),

    // Rating table
    knex.schema.createTable("rating", (table) => {
      table.string("uri").primary();
      table.string("author_did").notNullable();
      table.string("post_uri").notNullable();
      table.boolean("positive").notNullable();
      table.timestamp("created_at").notNullable();
      table.timestamp("indexed_at").notNullable();

      table.index(["author_did"]);
      table.index(["post_uri"]);
      table.index(["created_at"]);
      table
        .foreign("post_uri")
        .references("uri")
        .inTable("post")
        .onDelete("CASCADE");
    }),
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.all([
    knex.schema.dropTableIfExists("rating"),
    knex.schema.dropTableIfExists("auth_state"),
    knex.schema.dropTableIfExists("auth_session"),
    knex.schema.dropTableIfExists("post"),
    knex.schema.dropTableIfExists("status"),
  ]);
};
