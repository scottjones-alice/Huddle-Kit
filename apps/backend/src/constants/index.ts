import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { createMessageObjectSchema } from "stoker/openapi/schemas";

export const ZOD_ERROR_MESSAGES = {
  EXPECTED_NUMBER: "Invalid input: expected number, received NaN",
  EXPECTED_STRING: "Invalid input: expected string, received undefined",
  NO_UPDATES: "No updates provided",
  REQUIRED: "Required",
};

export const ZOD_ERROR_CODES = {
  INVALID_UPDATES: "invalid_updates",
};

export const notFoundSchema = createMessageObjectSchema(
  HttpStatusPhrases.NOT_FOUND
);
