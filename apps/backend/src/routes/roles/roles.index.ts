import { createAuthedRouter } from "@/lib/create-app";
import { requireSession } from "@/middlewares/require-session";
import { auth } from "@/services/auth";

import * as handlers from "./roles.handlers";
import * as routes from "./roles.route";

const session = requireSession(
  async (headers) => await auth.api.getSession({ headers })
);

const router = createAuthedRouter();

router.use("/members", session);
router.use("/role-assignments", session);
router.use("/role-assignments/*", session);

export default router
  .openapi(routes.listMembers, handlers.listMembers)
  .openapi(routes.listJobs, handlers.listJobs)
  .openapi(routes.grantJob, handlers.grantJob)
  .openapi(routes.endJob, handlers.endJob);
