import { createUserRouter } from "@/lib/create-app";
import { requireUser } from "@/middlewares/require-user";
import { auth } from "@/services/auth";

import * as handlers from "./membership.handlers";
import * as routes from "./membership.route";

const user = requireUser(
  async (headers) => await auth.api.getSession({ headers })
);

const router = createUserRouter();

const PROTECTED_PATHS = [
  "/me",
  "/clubs",
  "/club-members/*",
  "/invitations",
  "/invitations/*",
];
for (const path of PROTECTED_PATHS) {
  router.use(path, user);
}

export default router
  .openapi(routes.me, handlers.me)
  .openapi(routes.createClub, handlers.createClub)
  .openapi(routes.changeMemberRoles, handlers.changeMemberRoles)
  .openapi(routes.removeMember, handlers.removeMember)
  .openapi(routes.listInvitations, handlers.listInvitations)
  .openapi(routes.createInvitation, handlers.createInvitation)
  .openapi(routes.cancelInvitation, handlers.cancelInvitation)
  .openapi(routes.previewInvitation, handlers.previewInvitation)
  .openapi(routes.acceptInvitation, handlers.acceptInvitation);
