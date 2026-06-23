/**
 * Tune indexes for the PostView query paths.
 *
 * getPostsByLocation() filters with ST_DWithin(location::geography, ...) and
 * getRatingCounts() aggregates ratings grouped by post_uri. This migration
 * adds indexes that match those access patterns.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // The original GiST index is on the geometry type, but the location query
  // now casts to geography (so the radius is measured in meters). Replace it
  // with a functional GiST index on the geography cast so ST_DWithin can use
  // an index scan instead of a sequential scan.
  await knex.raw("DROP INDEX IF EXISTS post_location_index");
  await knex.raw(
    "CREATE INDEX post_location_geography_index ON post USING gist ((location::geography))",
  );

  // Aggregating positive/negative rating counts reads (post_uri, positive).
  // A composite index lets Postgres satisfy the grouped aggregation with an
  // index-only scan. It also covers post_uri lookups (FK cascade deletes),
  // so the standalone post_uri index becomes redundant.
  await knex.raw("DROP INDEX IF EXISTS rating_post_uri_index");
  await knex.raw(
    "CREATE INDEX rating_post_uri_positive_index ON rating (post_uri, positive)",
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw("DROP INDEX IF EXISTS rating_post_uri_positive_index");
  await knex.raw("CREATE INDEX rating_post_uri_index ON rating (post_uri)");

  await knex.raw("DROP INDEX IF EXISTS post_location_geography_index");
  await knex.raw(
    "CREATE INDEX post_location_index ON post USING gist (location)",
  );
};
