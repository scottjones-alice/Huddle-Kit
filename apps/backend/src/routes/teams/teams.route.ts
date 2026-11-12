import { TEAM_MEMBER_ROLES } from "@alice/database";
import {
  seasonSelectSchema,
  teamInsertSchema,
  teamMembershipSelectSchema,
  teamSelectSchema,
} from "@alice/database/validation";
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import {
  errorBody,
  idParams,
  includeArchivedQuery,
  invalidBody,
  notFoundBody,
  sessionErrors,
} from "@/lib/route-kit";

const TAGS = ["Teams"];

const seasonBody = z
  .object({
    endsOn: z.iso.date(),
    isCurrent: z
      .boolean()
      .optional()
      .describe("Making this season current makes the old one not current."),
    name: z.string().trim().min(1).max(100),
    startsOn: z.iso.date(),
  })
  .refine((season) => season.endsOn > season.startsOn, {
    message: "A season must end after it starts",
    path: ["endsOn"],
  });

const seasonChanges = z
  .object({
    endsOn: z.iso.date(),
    isCurrent: z.boolean(),
    name: z.string().trim().min(1).max(100),
    startsOn: z.iso.date(),
  })
  .partial();

const teamBody = z.object({
  ageGroup: teamInsertSchema.shape.ageGroup.describe(
    "Under-N, so 12 means U12. Leave out for open age."
  ),
  name: teamInsertSchema.shape.name,
  seasonId: z.uuid(),
  trainingVenueId: z.uuid().nullish(),
});

const teamChanges = teamBody.partial().extend({
  isActive: z
    .boolean()
    .optional()
    .describe("false archives the team, true brings it back."),
});

const rosterEntry = z.object({
  endsOn: z.iso.date().nullable(),
  firstName: z.string(),
  id: z.uuid().describe("The membership's id."),
  lastName: z.string(),
  personId: z.uuid(),
  role: z.enum(TEAM_MEMBER_ROLES),
  shirtNumber: z.number().int().nullable(),
  startsOn: z.iso.date(),
});

const membershipBody = z.object({
  personId: z.uuid(),
  role: z.enum(TEAM_MEMBER_ROLES),
  shirtNumber: z.number().int().min(0).max(999).nullish(),
  startsOn: z.iso.date().optional().describe("Defaults to today."),
});

export const listSeasons = createRoute({
  description: "The club's seasons, newest first.",
  method: "get",
  operationId: "listSeasons",
  path: "/seasons",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ seasons: z.array(seasonSelectSchema) }),
      "The seasons."
    ),
    ...sessionErrors,
  },
  summary: "List seasons",
  tags: TAGS,
});

export const createSeason = createRoute({
  description: "Starts a season. Club admins only.",
  method: "post",
  operationId: "createSeason",
  path: "/seasons",
  request: { body: jsonContentRequired(seasonBody, "The season.") },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(seasonSelectSchema, "The season."),
    [HttpStatusCodes.CONFLICT]: errorBody("That name is already used."),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Add a season",
  tags: TAGS,
});

export const updateSeason = createRoute({
  description:
    "Changes a season, or makes it the current one. Club admins only.",
  method: "patch",
  operationId: "updateSeason",
  path: "/seasons/{id}",
  request: {
    body: jsonContentRequired(seasonChanges, "The fields to change."),
    params: idParams("season"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(seasonSelectSchema, "The season."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("season"),
    [HttpStatusCodes.CONFLICT]: errorBody("That name is already used."),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Change a season",
  tags: TAGS,
});

export const listTeams = createRoute({
  description: "The club's teams, optionally for one season.",
  method: "get",
  operationId: "listTeams",
  path: "/teams",
  request: {
    query: includeArchivedQuery.extend({
      seasonId: z.uuid().optional().describe("Only teams in this season."),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ teams: z.array(teamSelectSchema) }),
      "The teams."
    ),
    ...sessionErrors,
  },
  summary: "List teams",
  tags: TAGS,
});

export const createTeam = createRoute({
  description: "Adds a team to a season. Club admins only.",
  method: "post",
  operationId: "createTeam",
  path: "/teams",
  request: { body: jsonContentRequired(teamBody, "The team.") },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(teamSelectSchema, "The team."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("season or venue"),
    [HttpStatusCodes.CONFLICT]: errorBody("The season already has that team."),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Add a team",
  tags: TAGS,
});

export const getTeam = createRoute({
  description: "One team. The roster is a separate call.",
  method: "get",
  operationId: "getTeam",
  path: "/teams/{id}",
  request: { params: idParams("team") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(teamSelectSchema, "The team."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("team"),
    ...sessionErrors,
  },
  summary: "Get a team",
  tags: TAGS,
});

export const updateTeam = createRoute({
  description:
    "Changes a team, or archives it with `isActive: false`. Club admins only.",
  method: "patch",
  operationId: "updateTeam",
  path: "/teams/{id}",
  request: {
    body: jsonContentRequired(teamChanges, "The fields to change."),
    params: idParams("team"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(teamSelectSchema, "The team."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("team"),
    [HttpStatusCodes.CONFLICT]: errorBody("The season already has that team."),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Change or archive a team",
  tags: TAGS,
});

export const getRoster = createRoute({
  description:
    "Who is on the team now. Club admins and the team's coaches see everyone. A player, or the parent of a player, on the team sees it too. Anyone else gets a 404.",
  method: "get",
  operationId: "getTeamRoster",
  path: "/teams/{id}/members",
  request: { params: idParams("team") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ members: z.array(rosterEntry) }),
      "The current roster."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("team"),
    ...sessionErrors,
  },
  summary: "Get a team's roster",
  tags: TAGS,
});

export const addToTeam = createRoute({
  description:
    "Puts a person on a team as a player, coach, manager or volunteer. Club admins and the team's own coaches can do this.",
  method: "post",
  operationId: "addTeamMember",
  path: "/teams/{id}/members",
  request: {
    body: jsonContentRequired(membershipBody, "Who and in what role."),
    params: idParams("team"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      teamMembershipSelectSchema,
      "The membership."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("team or person"),
    [HttpStatusCodes.CONFLICT]: errorBody("Already on the team in that role."),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Add a person to a team",
  tags: TAGS,
});

export const endMembership = createRoute({
  description:
    "Takes someone off a team from today. The record stays as history of who played and when. Club admins and the team's own coaches can do this.",
  method: "post",
  operationId: "endTeamMembership",
  path: "/team-memberships/{id}/end",
  request: { params: idParams("membership") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      teamMembershipSelectSchema,
      "The ended membership."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("membership"),
    ...sessionErrors,
  },
  summary: "Take a person off a team",
  tags: TAGS,
});

export type ListSeasonsRoute = typeof listSeasons;
export type CreateSeasonRoute = typeof createSeason;
export type UpdateSeasonRoute = typeof updateSeason;
export type ListTeamsRoute = typeof listTeams;
export type CreateTeamRoute = typeof createTeam;
export type GetTeamRoute = typeof getTeam;
export type UpdateTeamRoute = typeof updateTeam;
export type GetRosterRoute = typeof getRoster;
export type AddToTeamRoute = typeof addToTeam;
export type EndMembershipRoute = typeof endMembership;
