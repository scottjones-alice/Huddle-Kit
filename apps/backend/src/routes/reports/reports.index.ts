import { createAuthedRouter } from "@/lib/create-app";
import { requireSession } from "@/middlewares/require-session";
import { auth } from "@/services/auth";

import * as handlers from "./reports.handlers";
import * as routes from "./reports.route";

const session = requireSession(
  async (headers) => await auth.api.getSession({ headers })
);

const router = createAuthedRouter();

router.use("/reports/*", session);

export default router
  .openapi(routes.clubSummary, handlers.clubSummary)
  .openapi(routes.financeSummary, handlers.financeSummary)
  .openapi(routes.attendanceSummary, handlers.attendanceSummary);
