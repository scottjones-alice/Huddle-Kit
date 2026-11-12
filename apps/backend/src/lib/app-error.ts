import * as HttpStatusCodes from "stoker/http-status-codes";

/** HTTP statuses a service may ask for. Anything else is a bug and becomes a 500. */
export type AppErrorStatus =
  | typeof HttpStatusCodes.FORBIDDEN
  | typeof HttpStatusCodes.NOT_FOUND
  | typeof HttpStatusCodes.CONFLICT
  | typeof HttpStatusCodes.UNPROCESSABLE_ENTITY;

/**
 * An error the caller can act on. Services throw these and `onError` turns
 * them into a response, so handlers stay free of try/catch.
 */
export class AppError extends Error {
  readonly status: AppErrorStatus;

  constructor(status: AppErrorStatus, message: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

/** "Not found" for something that is missing, or is in another club (the same answer, so ids can't be probed). */
export const notFound = (what: string): AppError =>
  new AppError(HttpStatusCodes.NOT_FOUND, `${what} not found`);

export const forbidden = (message: string): AppError =>
  new AppError(HttpStatusCodes.FORBIDDEN, message);

export const conflict = (message: string): AppError =>
  new AppError(HttpStatusCodes.CONFLICT, message);

export const invalid = (message: string): AppError =>
  new AppError(HttpStatusCodes.UNPROCESSABLE_ENTITY, message);
