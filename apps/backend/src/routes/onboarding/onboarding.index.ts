import { createAuthedRouter } from "@/lib/create-app";
import { requireSession } from "@/middlewares/require-session";
import { auth } from "@/services/auth";

import * as handlers from "./onboarding.handlers";
import * as routes from "./onboarding.route";

const session = requireSession(
  async (headers) => await auth.api.getSession({ headers })
);

const router = createAuthedRouter();

router.use("/onboarding", session);
router.use("/onboarding/*", session);

export default router
  .openapi(routes.get, handlers.get)
  .openapi(routes.saveMemberStep, handlers.saveMember)
  .openapi(routes.saveClubStep, handlers.saveClub)
  .openapi(routes.getDraft, handlers.getDraft)
  .openapi(routes.saveDraft, handlers.saveDraft)
  .openapi(routes.finishDraft, handlers.finishDraft);
