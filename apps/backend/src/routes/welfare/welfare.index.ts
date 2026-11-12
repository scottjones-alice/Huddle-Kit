import { createAuthedRouter } from "@/lib/create-app";
import { requireSession } from "@/middlewares/require-session";
import { auth } from "@/services/auth";

import * as handlers from "./welfare.handlers";
import * as routes from "./welfare.route";

const session = requireSession(
  async (headers) => await auth.api.getSession({ headers })
);

const router = createAuthedRouter();

for (const base of [
  "/incidents",
  "/medical-records",
  "/allergies",
  "/qualifications",
]) {
  router.use(base, session);
  router.use(`${base}/*`, session);
}
for (const suffix of [
  "health",
  "medical-records",
  "allergies",
  "qualifications",
]) {
  router.use(`/people/:id/${suffix}`, session);
}

export default router
  .openapi(routes.getHealth, handlers.getHealth)
  .openapi(routes.addMedicalRecord, handlers.addMedicalRecord)
  .openapi(routes.updateMedicalRecord, handlers.updateMedicalRecord)
  .openapi(routes.addAllergy, handlers.addAllergy)
  .openapi(routes.updateAllergy, handlers.updateAllergy)
  .openapi(routes.listIncidents, handlers.listIncidents)
  .openapi(routes.createIncident, handlers.createIncident)
  .openapi(routes.getIncident, handlers.getIncident)
  .openapi(routes.updateIncident, handlers.updateIncident)
  .openapi(routes.listQualifications, handlers.listQualifications)
  .openapi(routes.addQualification, handlers.addQualification)
  .openapi(routes.updateQualification, handlers.updateQualification);
