import * as HttpStatusCodes from "stoker/http-status-codes";

import { runHealthChecks } from "@/lib/health";
import type { HealthCheck } from "@/lib/health";
import type { AppRouteHandler } from "@/types";

import packageJSON from "../../../package.json" with { type: "json" };
import type { RootRoute } from "./root.route";

export const createRootHandler =
  (checks: HealthCheck[], timeoutMs?: number): AppRouteHandler<RootRoute> =>
  async (c) => {
    const logger = c.get("logger");
    const report = await runHealthChecks(checks, {
      onError: (check, error) => {
        logger.error({ check, err: error }, "Health check failed");
      },
      timeoutMs,
    });

    const body = {
      ...report,
      name: packageJSON.name,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      version: packageJSON.version,
    };

    if (report.status === "unhealthy") {
      return c.json(body, HttpStatusCodes.SERVICE_UNAVAILABLE);
    }

    return c.json(body, HttpStatusCodes.OK);
  };
