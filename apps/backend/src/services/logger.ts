import pino from "pino";
import pretty from "pino-pretty";

import { keys } from "@/keys";

const { LOG_LEVEL, NODE_ENV } = keys();

/** The app-wide pino logger, shared by the request middleware and services. */
export const logger = pino(
  { level: LOG_LEVEL },
  NODE_ENV === "production" ? undefined : pretty()
);
