import { createAuthedRouter } from "@/lib/create-app";
import { requireSession } from "@/middlewares/require-session";
import { auth } from "@/services/auth";

import * as handlers from "./registrations.handlers";
import * as routes from "./registrations.route";

const session = requireSession(
  async (headers) => await auth.api.getSession({ headers })
);

const router = createAuthedRouter();

router.use("/registrations", session);
router.use("/registrations/*", session);

export default router
  .openapi(routes.listRegistrations, handlers.listRegistrations)
  .openapi(routes.register, handlers.register)
  .openapi(routes.updateRegistration, handlers.updateRegistration);
