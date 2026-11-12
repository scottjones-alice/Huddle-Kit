import { createAuthedRouter } from "@/lib/create-app";
import { requireSession } from "@/middlewares/require-session";
import { auth } from "@/services/auth";

import * as handlers from "./files.handlers";
import * as routes from "./files.route";

const session = requireSession(
  async (headers) => await auth.api.getSession({ headers })
);

const router = createAuthedRouter();

// Scoped to /files so unknown paths under the API prefix still get a plain 404.
router.use("/files", session);
router.use("/files/*", session);

export default router
  .openapi(routes.create, handlers.create)
  .openapi(routes.confirm, handlers.confirm)
  .openapi(routes.list, handlers.list)
  .openapi(routes.downloadUrl, handlers.downloadUrl)
  .openapi(routes.views, handlers.views)
  .openapi(routes.remove, handlers.remove);
