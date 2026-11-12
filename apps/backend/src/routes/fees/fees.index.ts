import { createAuthedRouter } from "@/lib/create-app";
import { requireSession } from "@/middlewares/require-session";
import { auth } from "@/services/auth";

import * as handlers from "./fees.handlers";
import * as routes from "./fees.route";

const session = requireSession(
  async (headers) => await auth.api.getSession({ headers })
);

const router = createAuthedRouter();

for (const base of ["/fees", "/charges"]) {
  router.use(base, session);
  router.use(`${base}/*`, session);
}

export default router
  .openapi(routes.listFees, handlers.listFees)
  .openapi(routes.createFee, handlers.createFee)
  .openapi(routes.updateFee, handlers.updateFee)
  .openapi(routes.chargePeople, handlers.chargePeople)
  .openapi(routes.listCharges, handlers.listCharges)
  .openapi(routes.listPayments, handlers.listPayments)
  .openapi(routes.recordPayment, handlers.recordPayment)
  .openapi(routes.closeCharge, handlers.closeCharge);
