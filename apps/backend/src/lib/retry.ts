import { setTimeout as sleep } from "node:timers/promises";

export type Outcome<T> = { ok: true; value: T } | { error: unknown; ok: false };

export interface RetryOptions<T> {
  /** Total tries, including the first. */
  attempts: number;
  /** The wait before the second try. It doubles each time, with jitter. */
  baseDelayMs: number;
  /** Replaces the real wait, for tests. */
  pause?: (ms: number) => Promise<void>;
  /** Looks at a result or an error and says whether another try may help. */
  shouldRetry: (outcome: Outcome<T>) => boolean;
}

const backoffMs = (baseDelayMs: number, attempt: number): number =>
  Math.random() * baseDelayMs * 2 ** (attempt - 1);

/**
 * Runs `task`, trying again after a growing, jittered pause while
 * `shouldRetry` says so. Only retry work that is safe to repeat: an idempotent
 * call, or a failure that is known not to have gone through.
 * The last result is returned, or the last error thrown, once tries run out.
 */
export const withRetry = async <T>(
  task: () => Promise<T>,
  { attempts, baseDelayMs, pause = sleep, shouldRetry }: RetryOptions<T>
): Promise<T> => {
  let attempt = 1;

  for (;;) {
    const canRetry = attempt < attempts;

    try {
      // Tries must run one after another, so awaiting inside the loop is the point.
      // oxlint-disable-next-line eslint/no-await-in-loop
      const value = await task();
      if (!(canRetry && shouldRetry({ ok: true, value }))) {
        return value;
      }
    } catch (error) {
      if (!(canRetry && shouldRetry({ error, ok: false }))) {
        throw error;
      }
    }

    // oxlint-disable-next-line eslint/no-await-in-loop
    await pause(backoffMs(baseDelayMs, attempt));
    attempt += 1;
  }
};
