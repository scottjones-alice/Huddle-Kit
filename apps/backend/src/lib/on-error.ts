import { StorageError } from "@alice/storage";
import type { StorageErrorCode } from "@alice/storage";
import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import { ConnectNotConfiguredError } from "@/services/connect-error";
import type { AppBindings } from "@/types";

const STORAGE_ERROR_STATUS = {
  checksum_mismatch: HttpStatusCodes.UNPROCESSABLE_ENTITY,
  checksum_required: HttpStatusCodes.UNPROCESSABLE_ENTITY,
  invalid_checksum: HttpStatusCodes.UNPROCESSABLE_ENTITY,
  invalid_content_type: HttpStatusCodes.UNPROCESSABLE_ENTITY,
  invalid_size: HttpStatusCodes.UNPROCESSABLE_ENTITY,
  not_found: HttpStatusCodes.NOT_FOUND,
  not_ready: HttpStatusCodes.CONFLICT,
  not_uploaded: HttpStatusCodes.CONFLICT,
  size_mismatch: HttpStatusCodes.UNPROCESSABLE_ENTITY,
} as const satisfies Record<StorageErrorCode, number>;

/**
 * Turns errors the caller can act on into 4xx responses. Anything else is logged
 * and answered with a generic 500: error messages from the database or S3 can
 * contain connection details and must never reach the client.
 */
export const onError: ErrorHandler<AppBindings> = (error, c) => {
  if (error instanceof StorageError) {
    return c.json(
      { code: error.code, message: error.message },
      STORAGE_ERROR_STATUS[error.code]
    );
  }

  if (error instanceof ConnectNotConfiguredError) {
    return c.json(
      { message: error.message },
      HttpStatusCodes.SERVICE_UNAVAILABLE
    );
  }

  if (error instanceof HTTPException) {
    return error.getResponse();
  }

  c.get("logger")?.error({ err: error }, "Unhandled error");

  return c.json(
    { message: HttpStatusPhrases.INTERNAL_SERVER_ERROR },
    HttpStatusCodes.INTERNAL_SERVER_ERROR
  );
};
