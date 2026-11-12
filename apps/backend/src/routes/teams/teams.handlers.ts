import { seasons, teams } from "@alice/database";
import {
  seasonSelectSchema,
  teamSelectSchema,
} from "@alice/database/validation";
import { desc, eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { callerOf } from "@/lib/caller";
import { isTrue } from "@/lib/schemas";
import { requireManager } from "@/services/access";
import { listInClub } from "@/services/crud";
import { db } from "@/services/database";
import {
  addToTeam as addToTeamRow,
  createSeason as createSeasonRow,
  createTeam as createTeamRow,
  endMembership as endMembershipRow,
  getRoster as getRosterRows,
  getTeam as getTeamRow,
  updateSeason as updateSeasonRow,
  updateTeam as updateTeamRow,
} from "@/services/teams";
import type { AuthedRouteHandler } from "@/types";

import type {
  AddToTeamRoute,
  CreateSeasonRoute,
  CreateTeamRoute,
  EndMembershipRoute,
  GetRosterRoute,
  GetTeamRoute,
  ListSeasonsRoute,
  ListTeamsRoute,
  UpdateSeasonRoute,
  UpdateTeamRoute,
} from "./teams.route";

export const listSeasons: AuthedRouteHandler<ListSeasonsRoute> = async (c) => {
  await callerOf(c);
  const rows = await db
    .select()
    .from(seasons)
    .where(eq(seasons.organizationId, c.get("organizationId")))
    .orderBy(desc(seasons.startsOn));
  return c.json(
    { seasons: seasonSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const createSeason: AuthedRouteHandler<CreateSeasonRoute> = async (
  c
) => {
  requireManager(await callerOf(c));
  const row = await createSeasonRow(
    db,
    c.get("organizationId"),
    c.req.valid("json")
  );
  return c.json(row, HttpStatusCodes.CREATED);
};

export const updateSeason: AuthedRouteHandler<UpdateSeasonRoute> = async (
  c
) => {
  requireManager(await callerOf(c));
  const { id } = c.req.valid("param");
  const row = await updateSeasonRow(
    db,
    c.get("organizationId"),
    id,
    c.req.valid("json")
  );
  return c.json(row, HttpStatusCodes.OK);
};

export const listTeams: AuthedRouteHandler<ListTeamsRoute> = async (c) => {
  await callerOf(c);
  const { includeArchived, seasonId } = c.req.valid("query");
  const rows = await listInClub(
    db,
    teams,
    c.get("organizationId"),
    seasonId === undefined ? undefined : eq(teams.seasonId, seasonId),
    isTrue(includeArchived) ? undefined : eq(teams.isActive, true)
  );
  return c.json(
    { teams: teamSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const createTeam: AuthedRouteHandler<CreateTeamRoute> = async (c) => {
  requireManager(await callerOf(c));
  const row = await createTeamRow(
    db,
    c.get("organizationId"),
    c.req.valid("json")
  );
  return c.json(row, HttpStatusCodes.CREATED);
};

export const getTeam: AuthedRouteHandler<GetTeamRoute> = async (c) => {
  await callerOf(c);
  const { id } = c.req.valid("param");
  return c.json(
    await getTeamRow(db, c.get("organizationId"), id),
    HttpStatusCodes.OK
  );
};

export const updateTeam: AuthedRouteHandler<UpdateTeamRoute> = async (c) => {
  requireManager(await callerOf(c));
  const { id } = c.req.valid("param");
  const row = await updateTeamRow(
    db,
    c.get("organizationId"),
    id,
    c.req.valid("json")
  );
  return c.json(row, HttpStatusCodes.OK);
};

export const getRoster: AuthedRouteHandler<GetRosterRoute> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  return c.json(
    { members: await getRosterRows(db, caller, id) },
    HttpStatusCodes.OK
  );
};

export const addToTeam: AuthedRouteHandler<AddToTeamRoute> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const row = await addToTeamRow(db, caller, id, c.req.valid("json"));
  return c.json(row, HttpStatusCodes.CREATED);
};

export const endMembership: AuthedRouteHandler<EndMembershipRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  return c.json(await endMembershipRow(db, caller, id), HttpStatusCodes.OK);
};
