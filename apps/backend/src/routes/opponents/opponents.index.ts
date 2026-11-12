import { createAuthedRouter } from "@/lib/create-app";
import { requireSession } from "@/middlewares/require-session";
import { auth } from "@/services/auth";

import * as handlers from "./opponents.handlers";
import * as routes from "./opponents.route";

const session = requireSession(
  async (headers) => await auth.api.getSession({ headers })
);

const router = createAuthedRouter();

router.use("/opponents", session);
router.use("/opponents/*", session);

export default router
  .openapi(routes.listOpponents, handlers.listOpponents)
  .openapi(routes.createOpponent, handlers.createOpponent)
  .openapi(routes.updateOpponent, handlers.updateOpponent);
