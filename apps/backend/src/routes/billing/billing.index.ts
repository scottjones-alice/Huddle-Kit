import { createAuthedRouter } from "@/lib/create-app";
import { requireSession } from "@/middlewares/require-session";
import { auth } from "@/services/auth";

import * as handlers from "./billing.handlers";
import * as routes from "./billing.route";

const session = requireSession(
  async (headers) => await auth.api.getSession({ headers })
);

const router = createAuthedRouter();

router.use("/billing", session);
router.use("/billing/*", session);

export default router
  .openapi(routes.status, handlers.status)
  .openapi(routes.checkout, handlers.checkout)
  .openapi(routes.portal, handlers.portal)
  .openapi(routes.cancel, handlers.cancel)
  .openapi(routes.restore, handlers.restore);
