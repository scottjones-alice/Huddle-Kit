/**
 * SQL snippets for CHECK constraints that keep the database as strict as the
 * Zod schemas. The value lists are the same `as const` arrays the Zod enums
 * use, so the two cannot drift apart.
 *
 * The values are interpolated as quoted literals, not parameters, because a
 * CHECK constraint is part of the table definition and cannot take parameters.
 * They only ever come from constant arrays in this codebase.
 */

import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

const literalList = (values: readonly string[]) =>
  sql.raw(values.map((value) => `'${value.replaceAll("'", "''")}'`).join(", "));

/** The column is one of these values. A null passes: add `.notNull()` to forbid it. */
export const isOneOf = (column: AnyPgColumn, values: readonly string[]) =>
  sql`${column} in (${literalList(values)})`;

/** The array column has at least one value and only these values. */
export const isNonEmptyArrayOf = (
  column: AnyPgColumn,
  values: readonly string[]
) =>
  sql`cardinality(${column}) > 0 and ${column} <@ array[${literalList(values)}]::text[]`;
