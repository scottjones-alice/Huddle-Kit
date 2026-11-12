import { createAuthedRouter } from "@/lib/create-app";
import { requireSession } from "@/middlewares/require-session";
import { auth } from "@/services/auth";

import * as handlers from "./payments.handlers";
import * as routes from "./payments.route";

const session = requireSession(
  async (headers) => await auth.api.getSession({ headers })
);

const router = createAuthedRouter();

router.use("/payments/*", session);

export default router
  .openapi(routes.account, handlers.account)
  .openapi(routes.onboarding, handlers.onboarding)
  .openapi(routes.checkout, handlers.checkout);
