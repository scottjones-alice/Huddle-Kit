import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

import { keys } from "./src/keys";

// drizzle-kit doesn't load env files itself. Scripts run from this package's
// folder, so the single root .env is two levels up.
config({ path: "../../.env", quiet: true });

export default defineConfig({
  breakpoints: true,

  dbCredentials: {
    url: keys().DATABASE_URL,
  },

  dialect: "postgresql",

  migrations: {
    schema: "drizzle",
    table: "__drizzle_migrations",
  },

  out: "./migrations",

  schema: "./src/schema/index.ts",

  schemaFilter: ["public"],

  tablesFilter: ["*"],

  verbose: true,
});
