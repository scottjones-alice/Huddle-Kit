import { createAuthedRouter } from "@/lib/create-app";
import { requireSession } from "@/middlewares/require-session";
import { auth } from "@/services/auth";

import * as handlers from "./club.handlers";
import * as routes from "./club.route";

const session = requireSession(
  async (headers) => await auth.api.getSession({ headers })
);

const router = createAuthedRouter();

router.use("/club", session);
router.use("/club/*", session);

export default router
  .openapi(routes.getClub, handlers.getClub)
  .openapi(routes.saveClub, handlers.saveClub);
