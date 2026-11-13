import path from "node:path";

import { createDatabase } from "@alice/database";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { E2E_DATABASE_URL } from "../env";

const DUPLICATE_DATABASE = "42P04";

/** Creates the e2e database if it is missing, by connecting to the server's own `postgres` database. */
const ensureDatabase = async (url: string): Promise<void> => {
  const target = new URL(url);
  const name = target.pathname.slice(1);
  if (!/^[a-z0-9_]+$/u.test(name)) {
    throw new Error(`Refusing to create a database named "${name}".`);
  }
  const admin = new URL(url);
  admin.pathname = "/postgres";
  const db = createDatabase({ url: admin.toString() });
  try {
    await db.$client.query(`CREATE DATABASE ${name}`);
  } catch (error) {
    const code =
      error instanceof Error && "code" in error ? error.code : undefined;
    if (code !== DUPLICATE_DATABASE) {
      throw error;
    }
  } finally {
    await db.$client.end();
  }
};

/** Makes sure the end-to-end database exists and has every migration applied. */
export default async function globalSetup() {
  await ensureDatabase(E2E_DATABASE_URL);
  const db = createDatabase({ url: E2E_DATABASE_URL });
  try {
    await migrate(db, {
      migrationsFolder: path.resolve(
        process.cwd(),
        "../../packages/database/migrations"
      ),
      migrationsSchema: "drizzle",
      migrationsTable: "__drizzle_migrations",
    });
  } finally {
    await db.$client.end();
  }
}
