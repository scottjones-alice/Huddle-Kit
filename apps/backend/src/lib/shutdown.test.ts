/* oxlint-disable unicorn/prefer-event-target -- Node's http.Server is an EventEmitter, so the fake is too. */
import { EventEmitter } from "node:events";

import { afterEach, describe, expect, it, vi } from "vitest";

import { isShuttingDown, resetLifecycle } from "@/lib/lifecycle";
import { createShutdown } from "@/lib/shutdown";
import type { ShutdownLogger } from "@/lib/shutdown";

const TIMEOUT_MS = 50;

/** A server whose close() finishes when the test says so. */
const fakeServer = () => {
  const server = Object.assign(new EventEmitter(), {
    close: vi.fn<() => void>(),
    closeAllConnections: vi.fn<() => void>(),
  });
  const finish = () => server.emit("close");
  return { finish, server };
};

const setup = (closeResources = vi.fn<() => Promise<void>>()) => {
  const { finish, server } = fakeServer();
  const exit = vi.fn<(code: number) => void>();
  const logger = {
    error: vi.fn<ShutdownLogger["error"]>(),
    info: vi.fn<ShutdownLogger["info"]>(),
  };
  const shutdown = createShutdown({
    close: closeResources,
    exit,
    logger,
    server,
    timeoutMs: TIMEOUT_MS,
  });
  return { closeResources, exit, finish, logger, server, shutdown };
};

describe(createShutdown, () => {
  afterEach(() => {
    resetLifecycle();
  });

  it("stops accepting, releases resources, then exits with the given code", async () => {
    const { closeResources, exit, finish, server, shutdown } = setup();
    closeResources.mockResolvedValue();

    const done = shutdown("SIGTERM", 0);
    finish();
    await done;

    expect(server.close).toHaveBeenCalledOnce();
    expect(closeResources).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledExactlyOnceWith(0);
    expect(server.closeAllConnections).not.toHaveBeenCalled();
  });

  it("marks the process as shutting down", async () => {
    const { closeResources, finish, shutdown } = setup();
    closeResources.mockResolvedValue();

    const done = shutdown("SIGTERM");
    finish();
    await done;

    expect(isShuttingDown()).toBeTruthy();
  });

  it("cuts connections and exits 1 when requests do not finish in time", async () => {
    const { closeResources, exit, server, shutdown } = setup();
    closeResources.mockResolvedValue();

    await shutdown("SIGTERM", 0);

    expect(server.closeAllConnections).toHaveBeenCalledOnce();
    expect(closeResources).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledExactlyOnceWith(1);
  });

  it("exits 1 when releasing resources fails", async () => {
    const { closeResources, exit, finish, logger, shutdown } = setup();
    const failure = new Error("pool already closed");
    closeResources.mockRejectedValue(failure);

    const done = shutdown("SIGTERM", 0);
    finish();
    await done;

    expect(exit).toHaveBeenCalledExactlyOnceWith(1);
    expect(logger.error).toHaveBeenCalledWith(
      { err: failure },
      "Shutdown failed"
    );
  });

  it("runs only once when called twice", async () => {
    const { closeResources, exit, finish, server, shutdown } = setup();
    closeResources.mockResolvedValue();

    const first = shutdown("SIGTERM", 0);
    const second = shutdown("SIGINT", 1);
    finish();
    await Promise.all([first, second]);

    expect(server.close).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledExactlyOnceWith(0);
  });
});
