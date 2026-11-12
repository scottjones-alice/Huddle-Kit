import path from "node:path";

import { createDatabase } from "@alice/database";
import { migrate } from "drizzle-orm/node-postgres/migrator";

/** Applies every migration to the test database once, before any test file runs. */
export default async function setup() {
  process.loadEnvFile(path.join(import.meta.dirname, "../../../../.env"));
  const url = process.env.TEST_DATABASE_URL;
  if (url === undefined || url === "") {
    throw new Error(
      "TEST_DATABASE_URL is not set. Add it to the root .env and create the database with `CREATE DATABASE huddlekit_test`."
    );
  }
  const db = createDatabase({ url });
  await migrate(db, {
    migrationsFolder: path.join(
      import.meta.dirname,
      "../../../../packages/database/migrations"
    ),
    migrationsSchema: "drizzle",
    migrationsTable: "__drizzle_migrations",
  });
  await db.$client.end();
}
