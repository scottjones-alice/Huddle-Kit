import type { Shutdown } from "@/lib/shutdown";

export interface ProcessHandlerLogger {
  fatal: (context: object, message: string) => void;
}

const STOP_SIGNALS = ["SIGINT", "SIGTERM"] as const;

/**
 * Wires the process to the shutdown. A stop signal is a normal exit. An
 * uncaught error or unhandled rejection leaves the process in an unknown
 * state, so it is logged and the process drains and exits with code 1 for the
 * supervisor to restart it.
 */
export const registerProcessHandlers = (
  shutdown: Shutdown,
  logger: ProcessHandlerLogger,
  target: Pick<NodeJS.EventEmitter, "on"> = process
): void => {
  for (const signal of STOP_SIGNALS) {
    target.on(signal, () => {
      void shutdown(signal, 0);
    });
  }

  target.on("uncaughtException", (error: unknown) => {
    logger.fatal({ err: error }, "Uncaught exception");
    void shutdown("uncaughtException", 1);
  });

  target.on("unhandledRejection", (reason: unknown) => {
    logger.fatal({ err: reason }, "Unhandled promise rejection");
    void shutdown("unhandledRejection", 1);
  });
};
