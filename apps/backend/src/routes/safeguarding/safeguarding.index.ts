import { createAuthedRouter } from "@/lib/create-app";
import { requireSession } from "@/middlewares/require-session";
import { auth } from "@/services/auth";

import * as handlers from "./safeguarding.handlers";
import * as routes from "./safeguarding.route";

const session = requireSession(
  async (headers) => await auth.api.getSession({ headers })
);

const router = createAuthedRouter();

router.use("/safeguarding/*", session);

export default router
  .openapi(routes.listChecks, handlers.listChecks)
  .openapi(routes.recordCheck, handlers.recordCheck)
  .openapi(routes.updateCheck, handlers.updateCheck)
  .openapi(routes.raiseConcern, handlers.raiseConcern)
  .openapi(routes.listConcerns, handlers.listConcerns)
  .openapi(routes.getConcern, handlers.getConcern)
  .openapi(routes.updateConcern, handlers.updateConcern)
  .openapi(routes.addNote, handlers.addNote);
