import type { ErrorResponse } from "resend";
import { describe, expect, it, vi } from "vitest";

import { shouldRetryEmailSend } from "@/lib/email-retry";
import { withRetry } from "@/lib/retry";

const pause = vi.fn<(ms: number) => Promise<void>>().mockResolvedValue();

const failure = (statusCode: number | null): { error: ErrorResponse } => ({
  error: { message: "nope", name: "application_error", statusCode },
});

describe(withRetry, () => {
  it("returns the first result when it is good", async () => {
    const task = vi.fn<() => Promise<string>>().mockResolvedValue("ok");

    const result = await withRetry(task, {
      attempts: 3,
      baseDelayMs: 10,
      pause,
      shouldRetry: () => false,
    });

    expect(result).toBe("ok");
    expect(task).toHaveBeenCalledOnce();
  });

  it("tries again after a bad result and returns the good one", async () => {
    const task = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce("bad")
      .mockResolvedValueOnce("good");

    const result = await withRetry(task, {
      attempts: 3,
      baseDelayMs: 10,
      pause,
      shouldRetry: (outcome) => outcome.ok && outcome.value === "bad",
    });

    expect(result).toBe("good");
    expect(task).toHaveBeenCalledTimes(2);
  });

  it("retries thrown errors, then throws the last one when tries run out", async () => {
    const task = vi
      .fn<() => Promise<string>>()
      .mockRejectedValue(new Error("down"));

    await expect(
      withRetry(task, {
        attempts: 3,
        baseDelayMs: 10,
        pause,
        shouldRetry: () => true,
      })
    ).rejects.toThrow("down");
    expect(task).toHaveBeenCalledTimes(3);
  });

  it("does not retry a thrown error the policy refuses", async () => {
    const task = vi
      .fn<() => Promise<string>>()
      .mockRejectedValue(new Error("bad input"));

    await expect(
      withRetry(task, {
        attempts: 3,
        baseDelayMs: 10,
        pause,
        shouldRetry: (outcome) => outcome.ok,
      })
    ).rejects.toThrow("bad input");
    expect(task).toHaveBeenCalledOnce();
  });

  it("returns the last bad result once tries run out", async () => {
    const task = vi.fn<() => Promise<string>>().mockResolvedValue("bad");

    const result = await withRetry(task, {
      attempts: 2,
      baseDelayMs: 10,
      pause,
      shouldRetry: () => true,
    });

    expect(result).toBe("bad");
    expect(task).toHaveBeenCalledTimes(2);
  });
});

describe(shouldRetryEmailSend, () => {
  it("never retries a sent email", () => {
    expect(
      shouldRetryEmailSend({ ok: true, value: { error: null } }, true)
    ).toBeFalsy();
  });

  it("retries a rate limit even without an idempotency key", () => {
    expect(
      shouldRetryEmailSend({ ok: true, value: failure(429) }, false)
    ).toBeTruthy();
  });

  it("retries a server error or dropped connection only with a key", () => {
    expect(
      shouldRetryEmailSend({ ok: true, value: failure(503) }, false)
    ).toBeFalsy();
    expect(
      shouldRetryEmailSend({ ok: true, value: failure(503) }, true)
    ).toBeTruthy();
    expect(
      shouldRetryEmailSend({ ok: true, value: failure(null) }, true)
    ).toBeTruthy();
  });

  it("never retries a rejected request such as a bad address", () => {
    expect(
      shouldRetryEmailSend({ ok: true, value: failure(422) }, true)
    ).toBeFalsy();
  });

  it("retries a thrown error only with a key", () => {
    const outcome = { error: new Error("reset"), ok: false } as const;

    expect(shouldRetryEmailSend(outcome, false)).toBeFalsy();
    expect(shouldRetryEmailSend(outcome, true)).toBeTruthy();
  });
});
