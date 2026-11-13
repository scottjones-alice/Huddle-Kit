import { spawnSync } from "node:child_process";

import { config } from "dotenv";
import pg from "pg";

import { keys } from "../src/keys";

// Scripts run from this package's folder, so the root .env is two levels up.
config({ path: "../../.env", quiet: true });

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

const reset = async (): Promise<void> => {
  const { DATABASE_URL: url } = keys();
  const { hostname } = new URL(url);

  if (!LOCAL_HOSTS.has(hostname) && process.env.DB_RESET_FORCE !== "1") {
    throw new Error(
      `Refusing to wipe non-local database "${hostname}". Set DB_RESET_FORCE=1 to override.`
    );
  }

  // oxlint-disable-next-line import/no-named-as-default-member
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query("DROP SCHEMA IF EXISTS public CASCADE");
    await client.query("DROP SCHEMA IF EXISTS drizzle CASCADE");
    await client.query("CREATE SCHEMA public");
  } finally {
    await client.end();
  }
  process.stdout.write("Database wiped.\n");

  const result = spawnSync("pnpm", ["exec", "drizzle-kit", "migrate"], {
    shell: true,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error("drizzle-kit migrate failed.");
  }
  process.stdout.write("Migrations applied.\n");
};

const commands: Record<string, () => Promise<void>> = { reset };

const name = process.argv[2] ?? "";
const command = Object.hasOwn(commands, name) ? commands[name] : undefined;

if (command === undefined) {
  process.stderr.write(
    `Unknown db command "${name}". Available: ${Object.keys(commands).join(", ")}\n`
  );
  process.exit(1);
}

try {
  await command();
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exit(1);
}
