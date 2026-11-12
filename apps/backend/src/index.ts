import { serve } from "@hono/node-server";

import app from "./app";
import { keys } from "./keys";
import { registerProcessHandlers } from "./lib/process-handlers";
import { createShutdown } from "./lib/shutdown";
import type { ClosableServer } from "./lib/shutdown";
import { db } from "./services/database";
import { logger } from "./services/logger";

const { BACKEND_PORT, SHUTDOWN_TIMEOUT_MS } = keys();

const server = serve({ fetch: app.fetch, port: BACKEND_PORT }, (info) => {
  logger.info(
    { port: info.port },
    `Server is running on http://localhost:${info.port} (API reference at /api/v1/reference)`
  );
});

const shutdown = createShutdown({
  // Runs once running requests have finished, so nothing is using the pool.
  close: async () => {
    await db.$client.end();
  },
  logger,
  // serve() returns an http.Server (or http2), both closable like this.
  server: server satisfies ClosableServer,
  timeoutMs: SHUTDOWN_TIMEOUT_MS,
});

registerProcessHandlers(shutdown, logger);
