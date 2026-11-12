/**
 * Whether the process has started shutting down. Middleware reads it to tell
 * clients to stop reusing their connection, so a load balancer drains us.
 */
let shuttingDown = false;

export const isShuttingDown = (): boolean => shuttingDown;

export const markShuttingDown = (): void => {
  shuttingDown = true;
};

/** Test helper: lets one test file start a fresh lifecycle. */
export const resetLifecycle = (): void => {
  shuttingDown = false;
};
