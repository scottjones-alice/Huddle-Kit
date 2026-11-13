import { keys as authKeys } from "@alice/authentication/keys";
import type { InvitationRecord } from "@alice/database/validation";
import type { Context } from "hono";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { forbidden } from "@/lib/app-error";
import { loadCaller } from "@/services/access";
import type { Caller } from "@/services/access";
import { db } from "@/services/database";
import * as membership from "@/services/membership";
import { sendEmail } from "@/services/resend";
import type { UserBindings, UserRouteHandler } from "@/types";

import type {
  AcceptInvitationRoute,
  CancelInvitationRoute,
  ChangeMemberRolesRoute,
  CreateClubRoute,
  CreateInvitationRoute,
  ListInvitationsRoute,
  MeRoute,
  PreviewInvitationRoute,
  RemoveMemberRoute,
} from "./membership.route";

/** The caller in their own club. The club comes from the login, so no club id is ever sent. */
const clubCaller = async (c: Context<UserBindings>): Promise<Caller> => {
  const { id } = c.get("user");
  const current = await membership.findMembership(db, id);
  if (current === null) {
    throw forbidden("You don't belong to a club yet");
  }
  return await loadCaller(db, { organizationId: current.club.id, userId: id });
};

const serializeInvitation = (row: InvitationRecord) => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
  expiresAt: row.expiresAt.toISOString(),
});

export const me: UserRouteHandler<MeRoute> = async (c) =>
  c.json(
    { membership: await membership.findMembership(db, c.get("user").id) },
    HttpStatusCodes.OK
  );

export const createClub: UserRouteHandler<CreateClubRoute> = async (c) => {
  const club = await membership.createClub(
    db,
    c.get("user").id,
    c.req.valid("json")
  );
  return c.json({ club }, HttpStatusCodes.CREATED);
};

export const changeMemberRoles: UserRouteHandler<
  ChangeMemberRolesRoute
> = async (c) => {
  const updated = await membership.changeMemberRoles(
    db,
    await clubCaller(c),
    c.req.valid("param").id,
    c.req.valid("json").roles
  );
  return c.json({ member: updated }, HttpStatusCodes.OK);
};

export const removeMember: UserRouteHandler<RemoveMemberRoute> = async (c) => {
  await membership.removeMember(
    db,
    await clubCaller(c),
    c.req.valid("param").id
  );
  return c.body(null, HttpStatusCodes.NO_CONTENT);
};

export const listInvitations: UserRouteHandler<ListInvitationsRoute> = async (
  c
) => {
  const caller = await clubCaller(c);
  const rows = await membership.listInvitations(db, caller);
  return c.json(
    { invitations: rows.map((row) => serializeInvitation(row)) },
    HttpStatusCodes.OK
  );
};

export const createInvitation: UserRouteHandler<CreateInvitationRoute> = async (
  c
) => {
  const caller = await clubCaller(c);
  const input = c.req.valid("json");
  const [invitation, current] = await Promise.all([
    membership.createInvitation(db, caller, {
      email: input.email,
      personId: input.personId,
      role: input.roles,
      teamId: input.teamId,
      teamRole: input.teamRole,
    }),
    membership.findMembership(db, caller.userId),
  ]);
  void sendEmail({
    props: {
      inviteUrl: `${authKeys().PLATFORM_URL}/accept-invite/${invitation.id}`,
      inviterName: c.get("user").email,
      teamName: current?.club.name ?? "your club",
    },
    template: "accept-invite",
    to: invitation.email,
  });
  return c.json(
    { invitation: serializeInvitation(invitation) },
    HttpStatusCodes.CREATED
  );
};

export const cancelInvitation: UserRouteHandler<CancelInvitationRoute> = async (
  c
) => {
  await membership.cancelInvitation(
    db,
    await clubCaller(c),
    c.req.valid("param").id
  );
  return c.body(null, HttpStatusCodes.NO_CONTENT);
};

export const previewInvitation: UserRouteHandler<
  PreviewInvitationRoute
> = async (c) => {
  const invitation = await membership.previewInvitation(
    db,
    c.req.valid("param").id,
    c.get("user")
  );
  return c.json(
    { ...invitation, expiresAt: invitation.expiresAt.toISOString() },
    HttpStatusCodes.OK
  );
};

export const acceptInvitation: UserRouteHandler<AcceptInvitationRoute> = async (
  c
) =>
  c.json(
    {
      membership: await membership.acceptInvitation(
        db,
        c.req.valid("param").id,
        c.get("user")
      ),
    },
    HttpStatusCodes.OK
  );
