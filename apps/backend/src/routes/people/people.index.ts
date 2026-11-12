import { createAuthedRouter } from "@/lib/create-app";
import { requireSession } from "@/middlewares/require-session";
import { auth } from "@/services/auth";

import * as handlers from "./people.handlers";
import * as routes from "./people.route";

const session = requireSession(
  async (headers) => await auth.api.getSession({ headers })
);

const router = createAuthedRouter();

router.use("/people", session);
router.use("/people/*", session);

export default router
  .openapi(routes.listPeople, handlers.listPeople)
  .openapi(routes.createPerson, handlers.createPerson)
  .openapi(routes.getPerson, handlers.getPerson)
  .openapi(routes.updatePerson, handlers.updatePerson)
  .openapi(routes.linkPeople, handlers.linkPeople);
