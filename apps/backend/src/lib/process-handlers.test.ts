/* oxlint-disable unicorn/prefer-event-target -- process is an EventEmitter, so the fake is too. */
import { EventEmitter } from "node:events";

import { describe, expect, it, vi } from "vitest";

import { registerProcessHandlers } from "@/lib/process-handlers";
import type { ProcessHandlerLogger } from "@/lib/process-handlers";
import type { Shutdown } from "@/lib/shutdown";

const setup = () => {
  const target = new EventEmitter();
  const shutdown = vi.fn<Shutdown>().mockResolvedValue();
  const logger = { fatal: vi.fn<ProcessHandlerLogger["fatal"]>() };
  registerProcessHandlers(shutdown, logger, target);
  return { logger, shutdown, target };
};

describe(registerProcessHandlers, () => {
  it.each(["SIGINT", "SIGTERM"])("shuts down cleanly on %s", (signal) => {
    const { shutdown, target } = setup();

    target.emit(signal);

    expect(shutdown).toHaveBeenCalledExactlyOnceWith(signal, 0);
  });

  it("logs and exits 1 on an uncaught exception", () => {
    const { logger, shutdown, target } = setup();
    const error = new Error("boom");

    target.emit("uncaughtException", error);

    expect(logger.fatal).toHaveBeenCalledWith(
      { err: error },
      "Uncaught exception"
    );
    expect(shutdown).toHaveBeenCalledExactlyOnceWith("uncaughtException", 1);
  });

  it("logs and exits 1 on an unhandled rejection", () => {
    const { logger, shutdown, target } = setup();
    const reason = new Error("nobody caught me");

    target.emit("unhandledRejection", reason);

    expect(logger.fatal).toHaveBeenCalledWith(
      { err: reason },
      "Unhandled promise rejection"
    );
    expect(shutdown).toHaveBeenCalledExactlyOnceWith("unhandledRejection", 1);
  });
});
