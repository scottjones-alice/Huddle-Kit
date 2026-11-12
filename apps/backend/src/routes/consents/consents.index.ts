import { createAuthedRouter } from "@/lib/create-app";
import { requireSession } from "@/middlewares/require-session";
import { auth } from "@/services/auth";

import * as handlers from "./consents.handlers";
import * as routes from "./consents.route";

const session = requireSession(
  async (headers) => await auth.api.getSession({ headers })
);

const router = createAuthedRouter();

for (const base of ["/consent-forms", "/consents"]) {
  router.use(base, session);
  router.use(`${base}/*`, session);
}
router.use("/people/:id/consents", session);

export default router
  .openapi(routes.listDocuments, handlers.listDocuments)
  .openapi(routes.publishDocument, handlers.publishDocument)
  .openapi(routes.retireDocument, handlers.retireDocument)
  .openapi(routes.listConsents, handlers.listConsents)
  .openapi(routes.grantConsent, handlers.grantConsent)
  .openapi(routes.withdrawConsent, handlers.withdrawConsent);
