const postgis = require("knex-postgis");
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const st = postgis(knex);
  return Promise.all([
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
      table.index(["location"]);
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
exports.down = async function (knex) {
  return Promise.all([
    knex.schema.dropTableIfExists("rating"),
    knex.schema.dropTableIfExists("post"),
  ]);
};
