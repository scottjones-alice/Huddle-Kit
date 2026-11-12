import { pinoLogger as honoPino } from "hono-pino";

import { logger } from "@/services/logger";

export function pinoLogger() {
  return honoPino({ pino: logger });
}
