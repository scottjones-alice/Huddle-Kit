export type NotificationErrorCode =
  | "subscriber_failed"
  | "trigger_failed"
  | "trigger_rejected";

/** Thrown when Novu rejects a request or cannot be reached. */
export class NotificationError extends Error {
  readonly code: NotificationErrorCode;

  constructor(code: NotificationErrorCode, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "NotificationError";
    this.code = code;
  }
}
