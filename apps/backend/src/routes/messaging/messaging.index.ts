import { createAuthedRouter } from "@/lib/create-app";
import { requireSession } from "@/middlewares/require-session";
import { auth } from "@/services/auth";

import * as handlers from "./messaging.handlers";
import * as routes from "./messaging.route";

const session = requireSession(
  async (headers) => await auth.api.getSession({ headers })
);

const router = createAuthedRouter();

for (const base of ["/announcements", "/notifications"]) {
  router.use(base, session);
  router.use(`${base}/*`, session);
}

export default router
  .openapi(routes.listAnnouncements, handlers.listAnnouncements)
  .openapi(routes.createAnnouncement, handlers.createAnnouncement)
  .openapi(routes.updateAnnouncement, handlers.updateAnnouncement)
  .openapi(routes.listNotifications, handlers.listNotifications)
  .openapi(routes.markAllRead, handlers.markAllRead)
  .openapi(routes.markRead, handlers.markRead);
