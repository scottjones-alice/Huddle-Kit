import { sql } from "drizzle-orm";

import type { HealthCheck } from "@/lib/health";
import { db } from "@/services/database";
import { storage } from "@/services/storage";

/**
 * Every dependency the API reports on. To add a real check for email, the
 * worker or novu once it is integrated, give its entry a `check` function:
 * resolve when it works, throw when it does not.
 */
export const healthChecks: HealthCheck[] = [
  {
    check: async () => {
      await db.execute(sql`select 1`);
    },
    critical: true,
    name: "database",
  },
  {
    check: async () => {
      await storage.ping();
    },
    critical: true,
    name: "storage",
  },
  // Not integrated yet. Add a `check` when the provider is wired in.
  { critical: false, name: "email" },
  { critical: false, name: "worker" },
  { critical: false, name: "novu" },
];
