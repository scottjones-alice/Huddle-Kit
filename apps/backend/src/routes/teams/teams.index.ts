import { createAuthedRouter } from "@/lib/create-app";
import { requireSession } from "@/middlewares/require-session";
import { auth } from "@/services/auth";

import * as handlers from "./teams.handlers";
import * as routes from "./teams.route";

const session = requireSession(
  async (headers) => await auth.api.getSession({ headers })
);

const router = createAuthedRouter();

for (const base of ["/seasons", "/teams", "/team-memberships"]) {
  router.use(base, session);
  router.use(`${base}/*`, session);
}

export default router
  .openapi(routes.listSeasons, handlers.listSeasons)
  .openapi(routes.createSeason, handlers.createSeason)
  .openapi(routes.updateSeason, handlers.updateSeason)
  .openapi(routes.listTeams, handlers.listTeams)
  .openapi(routes.createTeam, handlers.createTeam)
  .openapi(routes.getTeam, handlers.getTeam)
  .openapi(routes.updateTeam, handlers.updateTeam)
  .openapi(routes.getRoster, handlers.getRoster)
  .openapi(routes.addToTeam, handlers.addToTeam)
  .openapi(routes.endMembership, handlers.endMembership);
