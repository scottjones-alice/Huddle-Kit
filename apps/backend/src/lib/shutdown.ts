import { once } from "node:events";
import type { EventEmitter } from "node:events";
import { setTimeout as sleep } from "node:timers/promises";

import { markShuttingDown } from "@/lib/lifecycle";

export interface ShutdownLogger {
  error: (context: object, message: string) => void;
  info: (context: object, message: string) => void;
}

/** The part of http.Server the shutdown needs. */
export type ClosableServer = EventEmitter & {
  close: () => unknown;
  closeAllConnections?: () => void;
};

export interface CreateShutdownOptions {
  /** Releases resources after requests have drained, e.g. the database pool. */
  close: () => Promise<void>;
  exit?: (code: number) => void;
  logger: ShutdownLogger;
  server: ClosableServer;
  /** How long running requests get before connections are cut. */
  timeoutMs: number;
}

export type Shutdown = (reason: string, exitCode?: number) => Promise<void>;

/**
 * Builds the one function that stops the process cleanly: stop accepting
 * connections, let running requests finish, release resources, then exit.
 * Calling it again while it runs does nothing, so two signals can't race.
 * If the requests don't finish in time the connections are cut and the exit
 * code is 1, so the supervisor knows the stop was not clean.
 */
export const createShutdown = ({
  close,
  exit = (code) => process.exit(code),
  logger,
  server,
  timeoutMs,
}: CreateShutdownOptions): Shutdown => {
  let running: Promise<void> | undefined;

  const run = async (reason: string, exitCode: number): Promise<void> => {
    markShuttingDown();
    logger.info({ reason }, "Shutting down");

    const cancelTimer = new AbortController();
    const drained = (async () => {
      server.close();
      await once(server, "close");
      await close();
      return "drained" as const;
    })();
    const expired = sleep(timeoutMs, "expired" as const, {
      signal: cancelTimer.signal,
    });

    try {
      const outcome = await Promise.race([drained, expired]);
      cancelTimer.abort();

      if (outcome === "expired") {
        logger.error({ timeoutMs }, "Requests did not finish in time");
        server.closeAllConnections?.();
        await close().catch((error: unknown) => {
          logger.error({ err: error }, "Could not release resources");
        });
        exit(1);
        return;
      }

      exit(exitCode);
    } catch (error) {
      cancelTimer.abort();
      logger.error({ err: error }, "Shutdown failed");
      exit(1);
    }
  };

  return async (reason, exitCode = 0) => {
    running ??= run(reason, exitCode);
    await running;
  };
};
