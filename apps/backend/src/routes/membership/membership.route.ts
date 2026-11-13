import { CLUB_MEMBER_ROLES, TEAM_MEMBER_ROLES } from "@alice/database";
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import {
  errorBody,
  idParams,
  invalidBody,
  notFoundBody,
} from "@/lib/route-kit";

const TAGS = ["Membership"];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const MAX_NAME = 120;
const MIN_SLUG = 3;
const MAX_SLUG = 48;

const unauthorized = errorBody("No signed-in user.");
const forbidden = errorBody("The caller may not do this in their club.");
const conflictBody = errorBody("This clashes with something that exists.");

const roleSchema = z.enum(CLUB_MEMBER_ROLES);
const rolesSchema = z
  .array(roleSchema)
  .min(1)
  .describe("Access roles in the club. `member` is always included.");

const clubSchema = z.object({
  id: z.uuid(),
  logo: z.string().nullable(),
  name: z.string(),
  slug: z.string(),
});

const membershipSchema = z.object({
  club: clubSchema,
  memberId: z.uuid(),
  roles: z.array(roleSchema),
});

const invitationSchema = z.object({
  createdAt: z.iso.datetime(),
  email: z.string(),
  expiresAt: z.iso.datetime(),
  id: z.uuid(),
  personId: z.uuid().nullable(),
  role: z.string(),
  status: z.string(),
  teamId: z.uuid().nullable(),
  teamRole: z.string().nullable(),
});

export const me = createRoute({
  description:
    "The signed-in user's club and their roles in it, or `membership: null` if they have not joined or started a club yet. A login belongs to at most one club.",
  method: "get",
  operationId: "getMe",
  path: "/me",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ membership: membershipSchema.nullable() }),
      "The user's membership."
    ),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
  },
  summary: "Who am I and which club am I in",
  tags: TAGS,
});

export const createClub = createRoute({
  description:
    "Starts a new club and makes the caller its owner. Fails with 409 if this login already belongs to a club, or the address is taken.",
  method: "post",
  operationId: "createClub",
  path: "/clubs",
  request: {
    body: jsonContentRequired(
      z.object({
        name: z.string().trim().min(1).max(MAX_NAME),
        slug: z.string().min(MIN_SLUG).max(MAX_SLUG).regex(SLUG_PATTERN),
      }),
      "The club's name and web address."
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({ club: clubSchema }),
      "The new club."
    ),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.CONFLICT]: conflictBody,
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
  },
  summary: "Start a club",
  tags: TAGS,
});

export const changeMemberRoles = createRoute({
  description:
    "Sets a member's access roles. Owners and admins only; only an owner can make or change an owner, and the last owner can't be demoted.",
  method: "patch",
  operationId: "changeMemberRoles",
  path: "/club-members/{id}",
  request: {
    body: jsonContentRequired(
      z.object({ roles: rolesSchema }),
      "The roles the member should have."
    ),
    params: idParams("member"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ member: z.object({ id: z.uuid(), role: z.string() }) }),
      "The updated member."
    ),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.FORBIDDEN]: forbidden,
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("member"),
    [HttpStatusCodes.CONFLICT]: conflictBody,
  },
  summary: "Change a member's roles",
  tags: TAGS,
});

export const removeMember = createRoute({
  description:
    "Removes a member from the club, or lets the caller leave it by passing their own member id. The last owner can't leave.",
  method: "delete",
  operationId: "removeMember",
  path: "/club-members/{id}",
  request: { params: idParams("member") },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: { description: "The member was removed." },
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.FORBIDDEN]: forbidden,
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("member"),
    [HttpStatusCodes.CONFLICT]: conflictBody,
  },
  summary: "Remove a member or leave the club",
  tags: TAGS,
});

export const listInvitations = createRoute({
  description:
    "Invitations that have been sent and not yet answered. Owners and admins only.",
  method: "get",
  operationId: "listInvitations",
  path: "/invitations",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ invitations: z.array(invitationSchema) }),
      "Pending invitations."
    ),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.FORBIDDEN]: forbidden,
  },
  summary: "List pending invitations",
  tags: TAGS,
});

export const createInvitation = createRoute({
  description:
    "Invites someone by email and emails them a link. The invitation carries the access roles they get, and can carry the club's record of them (`personId`) and a team to join (`teamId` with `teamRole`, which needs `personId`). Owners and admins only; only an owner can invite another owner.",
  method: "post",
  operationId: "createInvitation",
  path: "/invitations",
  request: {
    body: jsonContentRequired(
      z.object({
        email: z.email(),
        personId: z.uuid().nullish(),
        roles: rolesSchema.default(["member"]),
        teamId: z.uuid().nullish(),
        teamRole: z.enum(TEAM_MEMBER_ROLES).nullish(),
      }),
      "Who to invite and what they will be."
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({ invitation: invitationSchema }),
      "The invitation."
    ),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.FORBIDDEN]: forbidden,
    [HttpStatusCodes.CONFLICT]: conflictBody,
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
  },
  summary: "Invite someone to the club",
  tags: TAGS,
});

export const cancelInvitation = createRoute({
  description: "Withdraws a pending invitation. Owners and admins only.",
  method: "delete",
  operationId: "cancelInvitation",
  path: "/invitations/{id}",
  request: { params: idParams("invitation") },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: "The invitation was canceled.",
    },
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.FORBIDDEN]: forbidden,
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("invitation"),
  },
  summary: "Cancel an invitation",
  tags: TAGS,
});

export const previewInvitation = createRoute({
  description:
    "What an invitation offers, for the accept page. Only the login whose verified email it was sent to can see it; anyone else gets 404, the same as for an invitation that doesn't exist.",
  method: "get",
  operationId: "getInvitation",
  path: "/invitations/{id}",
  request: { params: idParams("invitation") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        clubName: z.string(),
        expiresAt: z.iso.datetime(),
        id: z.uuid(),
        inviterName: z.string(),
        roles: z.array(roleSchema),
      }),
      "The invitation."
    ),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("invitation"),
  },
  summary: "See an invitation",
  tags: TAGS,
});

export const acceptInvitation = createRoute({
  description:
    "Joins the club the invitation is for, with the roles, person record and team it carries. Fails with 409 if this login already belongs to a club.",
  method: "post",
  operationId: "acceptInvitation",
  path: "/invitations/{id}/accept",
  request: { params: idParams("invitation") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ membership: membershipSchema.nullable() }),
      "The new membership."
    ),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("invitation"),
    [HttpStatusCodes.CONFLICT]: conflictBody,
  },
  summary: "Accept an invitation",
  tags: TAGS,
});

export type MeRoute = typeof me;
export type CreateClubRoute = typeof createClub;
export type ChangeMemberRolesRoute = typeof changeMemberRoles;
export type RemoveMemberRoute = typeof removeMember;
export type ListInvitationsRoute = typeof listInvitations;
export type CreateInvitationRoute = typeof createInvitation;
export type CancelInvitationRoute = typeof cancelInvitation;
export type PreviewInvitationRoute = typeof previewInvitation;
export type AcceptInvitationRoute = typeof acceptInvitation;
