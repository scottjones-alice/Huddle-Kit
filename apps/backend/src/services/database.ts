import { createDatabase } from "@alice/database";
import { keys } from "@alice/database/keys";

import { logger } from "@/services/logger";

const {
  DATABASE_LOGGER,
  DATABASE_POOL_MAX,
  DATABASE_STATEMENT_TIMEOUT_MS,
  DATABASE_URL,
} = keys();

export const db = createDatabase({
  logger: DATABASE_LOGGER,
  onPoolError: (error) => {
    logger.error({ err: error }, "Database pool error");
  },
  pool: {
    max: DATABASE_POOL_MAX,
    statementTimeoutMs: DATABASE_STATEMENT_TIMEOUT_MS,
  },
  url: DATABASE_URL,
});
