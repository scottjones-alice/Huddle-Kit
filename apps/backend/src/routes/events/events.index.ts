import { createAuthedRouter } from "@/lib/create-app";
import { requireSession } from "@/middlewares/require-session";
import { auth } from "@/services/auth";

import * as handlers from "./events.handlers";
import * as routes from "./events.route";

const session = requireSession(
  async (headers) => await auth.api.getSession({ headers })
);

const router = createAuthedRouter();

for (const base of ["/events", "/event-series"]) {
  router.use(base, session);
  router.use(`${base}/*`, session);
}

export default router
  .openapi(routes.listEvents, handlers.listEvents)
  .openapi(routes.createEvent, handlers.createEvent)
  .openapi(routes.getEvent, handlers.getEvent)
  .openapi(routes.updateEvent, handlers.updateEvent)
  .openapi(routes.setAvailability, handlers.setAvailability)
  .openapi(routes.listAvailability, handlers.listAvailability)
  .openapi(routes.recordAttendance, handlers.recordAttendance)
  .openapi(routes.listAttendance, handlers.listAttendance)
  .openapi(routes.setSquad, handlers.setSquad)
  .openapi(routes.getSquad, handlers.getSquad)
  .openapi(routes.listSeries, handlers.listSeries)
  .openapi(routes.createSeries, handlers.createSeries)
  .openapi(routes.updateSeries, handlers.updateSeries)
  .openapi(routes.extendSeries, handlers.extendSeries);
