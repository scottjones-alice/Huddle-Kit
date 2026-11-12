import type { ErrorResponse } from "resend";

import type { Outcome } from "@/lib/retry";

const TOO_MANY_REQUESTS = 429;
const SERVER_ERROR = 500;

interface SendResult {
  error: ErrorResponse | null;
}

/**
 * Whether a failed email send is worth repeating.
 * A 429 means Resend refused the email, so repeating it cannot double-send.
 * A 5xx, a dropped connection or a thrown error may have gone through, so
 * those are repeated only when the send carries an idempotency key, which makes
 * Resend ignore the repeat if the first try arrived.
 */
export const shouldRetryEmailSend = (
  outcome: Outcome<SendResult>,
  hasIdempotencyKey: boolean
): boolean => {
  if (!outcome.ok) {
    return hasIdempotencyKey;
  }

  const { error } = outcome.value;
  if (error === null) {
    return false;
  }
  if (error.statusCode === TOO_MANY_REQUESTS) {
    return true;
  }

  const unknownIfSent =
    error.statusCode === null || error.statusCode >= SERVER_ERROR;
  return unknownIfSent && hasIdempotencyKey;
};
