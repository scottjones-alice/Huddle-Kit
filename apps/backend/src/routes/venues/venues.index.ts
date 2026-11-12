import { createAuthedRouter } from "@/lib/create-app";
import { requireSession } from "@/middlewares/require-session";
import { auth } from "@/services/auth";

import * as handlers from "./venues.handlers";
import * as routes from "./venues.route";

const session = requireSession(
  async (headers) => await auth.api.getSession({ headers })
);

const router = createAuthedRouter();

router.use("/venues", session);
router.use("/venues/*", session);
router.use("/pitches", session);
router.use("/pitches/*", session);

export default router
  .openapi(routes.listVenues, handlers.listVenues)
  .openapi(routes.createVenue, handlers.createVenue)
  .openapi(routes.getVenue, handlers.getVenue)
  .openapi(routes.updateVenue, handlers.updateVenue)
  .openapi(routes.listPitches, handlers.listPitches)
  .openapi(routes.createPitch, handlers.createPitch)
  .openapi(routes.updatePitch, handlers.updatePitch);
