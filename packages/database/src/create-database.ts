import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { relations } from "./schema/relations";

const DEFAULT_POOL_MAX = 10;
const DEFAULT_CONNECTION_TIMEOUT_MS = 5000;
const DEFAULT_IDLE_TIMEOUT_MS = 30_000;
const DEFAULT_STATEMENT_TIMEOUT_MS = 15_000;

export interface PoolOptions {
  /** How long to wait for a free connection before failing. Default 5000. */
  connectionTimeoutMs?: number;
  /** Close connections that sit idle this long. Default 30000. */
  idleTimeoutMs?: number;
  /** Most connections open at once. Default 10. */
  max?: number;
  /** Postgres cancels any query running longer than this. Default 15000. */
  statementTimeoutMs?: number;
}

export interface CreateDatabaseOptions {
  url: string;
  logger?: boolean;
  /**
   * Called when an idle connection in the pool fails, for example when Postgres restarts.
   * The package never logs (conventions, Layer 3), so the app decides what to write down.
   */
  onPoolError?: (error: Error) => void;
  /** Connection pool limits. The defaults keep one slow query from stalling the API. */
  pool?: PoolOptions;
}

export const createDatabase = ({
  url,
  logger = false,
  onPoolError,
  pool: poolOptions = {},
}: CreateDatabaseOptions) => {
  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis:
      poolOptions.connectionTimeoutMs ?? DEFAULT_CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: poolOptions.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS,
    max: poolOptions.max ?? DEFAULT_POOL_MAX,
    statement_timeout:
      poolOptions.statementTimeoutMs ?? DEFAULT_STATEMENT_TIMEOUT_MS,
  });

  // The pool emits "error" when an idle connection dies. With no listener Node treats that
  // as an uncaught exception and the whole process exits, so one is always registered. The
  // pool drops the dead connection itself and opens a new one on the next query.
  pool.on("error", (error) => {
    onPoolError?.(error);
  });

  return drizzle({
    client: pool,
    logger,
    relations,
  });
};

export type Database = ReturnType<typeof createDatabase>;
