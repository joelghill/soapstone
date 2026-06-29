/**
 * Makes the `rating.positive` column nullable. Under the interaction model a
 * row may represent a discovery (the account has seen the post but not rated
 * it), in which case `positive` is null. "like" maps to true and "dislike" to
 * false.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return knex.schema.alterTable("rating", (table) => {
    table.boolean("positive").nullable().alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Will fail if discovery rows (positive = null) exist.
  return knex.schema.alterTable("rating", (table) => {
    table.boolean("positive").notNullable().alter();
  });
};
