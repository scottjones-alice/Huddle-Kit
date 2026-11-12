import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import * as schema from "../src/schema";

const migrationsDir = path.join(import.meta.dirname, "../migrations");

function migrationSql() {
  return readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) =>
      readFileSync(
        path.join(migrationsDir, entry.name, "migration.sql"),
        "utf-8"
      )
    )
    .join("\n");
}

describe("migrations", () => {
  it("create every table the schema declares", () => {
    const sql = migrationSql();

    const tables = Object.values(schema)
      .filter((value) => is(value, PgTable))
      .map((table) => getTableName(table));

    expect(tables.length).toBeGreaterThan(0);

    for (const table of tables) {
      expect(sql).toContain(`CREATE TABLE "${table}"`);
    }
  });

  it("include the Better Auth organization tables", () => {
    const sql = migrationSql();

    for (const table of ["organizations", "members", "invitations"]) {
      expect(sql).toContain(`CREATE TABLE "${table}"`);
    }
  });
});
