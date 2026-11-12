import { createRouter } from "@/lib/create-app";
import { healthChecks } from "@/lib/health-checks";

import { createRootHandler } from "./root.handlers";
import { rootRoute } from "./root.route";

const router = createRouter().openapi(
  rootRoute,
  createRootHandler(healthChecks)
);

export default router;
