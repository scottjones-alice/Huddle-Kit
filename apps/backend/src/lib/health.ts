import { setTimeout as sleep } from "node:timers/promises";

const DEFAULT_TIMEOUT_MS = 3000;

export type CheckStatus = "up" | "down" | "not_configured";
export type OverallStatus = "ok" | "degraded" | "unhealthy";

export interface HealthCheck {
  name: string;
  /** A failing critical check makes the whole API unhealthy (503). */
  critical: boolean;
  /**
   * Resolves when the dependency works and throws when it does not.
   * Leave it out while the dependency is not integrated yet: it is reported
   * as `not_configured` and never affects the overall status.
   */
  check?: (signal: AbortSignal) => Promise<void>;
}

export interface CheckResult {
  status: CheckStatus;
  latencyMs?: number;
  /** A short fixed reason. Real error messages are logged, never returned. */
  error?: "timeout" | "unavailable";
}

export interface HealthReport {
  status: OverallStatus;
  checks: Record<string, CheckResult>;
}

export interface RunHealthChecksOptions {
  timeoutMs?: number;
  /** Receives the real error so the caller can log it. */
  onError?: (name: string, error: unknown) => void;
}

class CheckTimeoutError extends Error {
  override name = "CheckTimeoutError";
}

const runWithTimeout = async (
  check: NonNullable<HealthCheck["check"]>,
  timeoutMs: number
): Promise<void> => {
  const timedOut = new AbortController();
  const cancelTimer = new AbortController();
  const timeout = (async () => {
    await sleep(timeoutMs, undefined, { signal: cancelTimer.signal });
    timedOut.abort();
    throw new CheckTimeoutError(`timed out after ${timeoutMs}ms`);
  })();

  try {
    await Promise.race([check(timedOut.signal), timeout]);
  } finally {
    cancelTimer.abort();
  }
};

const runCheck = async (
  { name, check }: HealthCheck,
  { timeoutMs = DEFAULT_TIMEOUT_MS, onError }: RunHealthChecksOptions
): Promise<CheckResult> => {
  if (check === undefined) {
    return { status: "not_configured" };
  }

  const started = performance.now();

  try {
    await runWithTimeout(check, timeoutMs);
    return { latencyMs: Math.round(performance.now() - started), status: "up" };
  } catch (error) {
    onError?.(name, error);
    return {
      error: error instanceof CheckTimeoutError ? "timeout" : "unavailable",
      latencyMs: Math.round(performance.now() - started),
      status: "down",
    };
  }
};

const summarize = (
  checks: HealthCheck[],
  results: CheckResult[]
): OverallStatus => {
  let overall: OverallStatus = "ok";

  for (const [index, result] of results.entries()) {
    if (result.status !== "down") {
      continue;
    }
    if (checks[index]?.critical) {
      return "unhealthy";
    }
    overall = "degraded";
  }

  return overall;
};

/** Runs every check in parallel and combines them into one report. */
export const runHealthChecks = async (
  checks: HealthCheck[],
  options: RunHealthChecksOptions = {}
): Promise<HealthReport> => {
  const results = await Promise.all(
    checks.map(async (check) => await runCheck(check, options))
  );

  return {
    checks: Object.fromEntries(
      checks.map((check, index) => [check.name, results[index]])
    ),
    status: summarize(checks, results),
  };
};
