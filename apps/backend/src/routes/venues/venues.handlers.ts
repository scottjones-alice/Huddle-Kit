import { pitches } from "@alice/database";
import { pitchSelectSchema } from "@alice/database/validation";
import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { conflict } from "@/lib/app-error";
import { callerOf } from "@/lib/caller";
import { isTrue } from "@/lib/schemas";
import { isUniqueViolation } from "@/lib/sql-errors";
import { requireManager } from "@/services/access";
import { insertInClub, listInClub, updateInClub } from "@/services/crud";
import { db } from "@/services/database";
import {
  assertVenueInClub,
  createVenue as createVenueRow,
  getVenue as getVenueRow,
  listVenues as listVenueRows,
  updateVenue as updateVenueRow,
} from "@/services/venues";
import type { AuthedRouteHandler } from "@/types";

import type {
  CreatePitchRoute,
  CreateVenueRoute,
  GetVenueRoute,
  ListPitchesRoute,
  ListVenuesRoute,
  UpdatePitchRoute,
  UpdateVenueRoute,
} from "./venues.route";

export const listVenues: AuthedRouteHandler<ListVenuesRoute> = async (c) => {
  await callerOf(c);
  const { includeArchived } = c.req.valid("query");
  const rows = await listVenueRows(
    db,
    c.get("organizationId"),
    isTrue(includeArchived)
  );
  return c.json({ venues: rows }, HttpStatusCodes.OK);
};

export const createVenue: AuthedRouteHandler<CreateVenueRoute> = async (c) => {
  requireManager(await callerOf(c));
  const venue = await createVenueRow(
    db,
    c.get("organizationId"),
    c.req.valid("json")
  );
  return c.json(venue, HttpStatusCodes.CREATED);
};

export const getVenue: AuthedRouteHandler<GetVenueRoute> = async (c) => {
  await callerOf(c);
  const { id } = c.req.valid("param");
  return c.json(
    await getVenueRow(db, c.get("organizationId"), id),
    HttpStatusCodes.OK
  );
};

export const updateVenue: AuthedRouteHandler<UpdateVenueRoute> = async (c) => {
  requireManager(await callerOf(c));
  const { id } = c.req.valid("param");
  const venue = await updateVenueRow(
    db,
    c.get("organizationId"),
    id,
    c.req.valid("json")
  );
  return c.json(venue, HttpStatusCodes.OK);
};

export const listPitches: AuthedRouteHandler<ListPitchesRoute> = async (c) => {
  await callerOf(c);
  const { includeArchived, venueId } = c.req.valid("query");
  const rows = await listInClub(
    db,
    pitches,
    c.get("organizationId"),
    venueId === undefined ? undefined : eq(pitches.venueId, venueId),
    isTrue(includeArchived) ? undefined : eq(pitches.isActive, true)
  );
  return c.json(
    { pitches: pitchSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const createPitch: AuthedRouteHandler<CreatePitchRoute> = async (c) => {
  requireManager(await callerOf(c));
  const organizationId = c.get("organizationId");
  const body = c.req.valid("json");
  await assertVenueInClub(db, organizationId, body.venueId);
  try {
    const row = await insertInClub(db, pitches, organizationId, body);
    return c.json(pitchSelectSchema.parse(row), HttpStatusCodes.CREATED);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict("That venue already has a pitch with that name");
    }
    throw error;
  }
};

export const updatePitch: AuthedRouteHandler<UpdatePitchRoute> = async (c) => {
  requireManager(await callerOf(c));
  const { id } = c.req.valid("param");
  const row = await updateInClub(
    db,
    pitches,
    c.get("organizationId"),
    id,
    c.req.valid("json"),
    "Pitch"
  );
  return c.json(pitchSelectSchema.parse(row), HttpStatusCodes.OK);
};
