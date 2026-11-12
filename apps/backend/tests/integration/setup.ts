import path from "node:path";

import { createDatabase } from "@alice/database";
import { vi } from "vitest";

/**
 * Runs before every integration test file. The routes talk to the TEST
 * database (never DATABASE_URL), and sign-in is replaced by two headers:
 * `x-test-user` (a user id) and `x-test-org` (the active club).
 */
process.loadEnvFile(path.join(import.meta.dirname, "../../../../.env"));

const testUrl = process.env.TEST_DATABASE_URL;
if (testUrl === undefined || testUrl === "") {
  throw new Error("TEST_DATABASE_URL is not set");
}

vi.mock("@/services/database", () => ({
  db: createDatabase({ url: testUrl }),
}));

vi.mock("@/services/auth", () => ({
  auth: {
    api: {
      getSession: ({ headers }: { headers: Headers }) => {
        const userId = headers.get("x-test-user");
        if (userId === null) {
          return null;
        }
        return {
          session: { activeOrganizationId: headers.get("x-test-org") },
          user: { id: userId },
        };
      },
    },
  },
}));
