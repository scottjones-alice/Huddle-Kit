import {
  eventAttendanceSelectSchema,
  eventAvailabilitySelectSchema,
  eventSelectSchema,
  eventSeriesSelectSchema,
  matchDetailSelectSchema,
  matchSquadSelectSchema,
} from "@alice/database/validation";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { callerOf } from "@/lib/caller";
import { db } from "@/services/database";
import {
  createEvent as createEventRow,
  createSeries as createSeriesRow,
  extendSeries as extendSeriesRows,
  getEvent as getEventRow,
  getSquad as getSquadRows,
  listAttendance as listAttendanceRows,
  listAvailability as listAvailabilityRows,
  listEvents as listEventRows,
  listSeries as listSeriesRows,
  recordAttendance as recordAttendanceRows,
  setAvailability as setAvailabilityRow,
  setSquad as setSquadRows,
  updateEvent as updateEventRow,
  updateSeries as updateSeriesRow,
} from "@/services/events";
import type { AuthedRouteHandler } from "@/types";

import type {
  CreateEventRoute,
  CreateSeriesRoute,
  ExtendSeriesRoute,
  GetEventRoute,
  GetSquadRoute,
  ListAttendanceRoute,
  ListAvailabilityRoute,
  ListEventsRoute,
  ListSeriesRoute,
  RecordAttendanceRoute,
  SetAvailabilityRoute,
  SetSquadRoute,
  UpdateEventRoute,
  UpdateSeriesRoute,
} from "./events.route";

const toDate = (value: string | null | undefined): Date | null | undefined =>
  value === null || value === undefined ? value : new Date(value);

const detail = (event: Awaited<ReturnType<typeof getEventRow>>) => ({
  ...eventSelectSchema.parse(event),
  match:
    event.match === null ? null : matchDetailSelectSchema.parse(event.match),
});

export const listEvents: AuthedRouteHandler<ListEventsRoute> = async (c) => {
  await callerOf(c);
  const { from, kind, limit, offset, status, teamId, to } =
    c.req.valid("query");
  const rows = await listEventRows(db, c.get("organizationId"), {
    from: toDate(from) ?? undefined,
    kind,
    limit,
    offset,
    status,
    teamId,
    to: toDate(to) ?? undefined,
  });
  return c.json(
    { events: eventSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const createEvent: AuthedRouteHandler<CreateEventRoute> = async (c) => {
  const caller = await callerOf(c);
  const { endsAt, match, meetAt, startsAt, ...rest } = c.req.valid("json");
  const event = await createEventRow(db, caller, {
    ...rest,
    endsAt: new Date(endsAt),
    match,
    meetAt: toDate(meetAt),
    startsAt: new Date(startsAt),
  });
  return c.json(detail(event), HttpStatusCodes.CREATED);
};

export const getEvent: AuthedRouteHandler<GetEventRoute> = async (c) => {
  await callerOf(c);
  const { id } = c.req.valid("param");
  return c.json(
    detail(await getEventRow(db, c.get("organizationId"), id)),
    HttpStatusCodes.OK
  );
};

export const updateEvent: AuthedRouteHandler<UpdateEventRoute> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const { endsAt, meetAt, startsAt, ...rest } = c.req.valid("json");
  const event = await updateEventRow(db, caller, id, {
    ...rest,
    ...(endsAt === undefined ? {} : { endsAt: new Date(endsAt) }),
    ...(meetAt === undefined ? {} : { meetAt: toDate(meetAt) }),
    ...(startsAt === undefined ? {} : { startsAt: new Date(startsAt) }),
  });
  return c.json(detail(event), HttpStatusCodes.OK);
};

export const setAvailability: AuthedRouteHandler<SetAvailabilityRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const row = await setAvailabilityRow(db, caller, id, c.req.valid("json"));
  return c.json(eventAvailabilitySelectSchema.parse(row), HttpStatusCodes.OK);
};

export const listAvailability: AuthedRouteHandler<
  ListAvailabilityRoute
> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const rows = await listAvailabilityRows(db, caller, id);
  return c.json(
    { availability: eventAvailabilitySelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const recordAttendance: AuthedRouteHandler<
  RecordAttendanceRoute
> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const { records } = c.req.valid("json");
  const rows = await recordAttendanceRows(db, caller, id, records);
  return c.json(
    { attendance: eventAttendanceSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const listAttendance: AuthedRouteHandler<ListAttendanceRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const rows = await listAttendanceRows(db, caller, id);
  return c.json(
    { attendance: eventAttendanceSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const setSquad: AuthedRouteHandler<SetSquadRoute> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const { squad } = c.req.valid("json");
  const rows = await setSquadRows(db, caller, id, squad);
  return c.json(
    { squad: matchSquadSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const getSquad: AuthedRouteHandler<GetSquadRoute> = async (c) => {
  await callerOf(c);
  const { id } = c.req.valid("param");
  const rows = await getSquadRows(db, c.get("organizationId"), id);
  return c.json(
    { squad: matchSquadSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const listSeries: AuthedRouteHandler<ListSeriesRoute> = async (c) => {
  await callerOf(c);
  const rows = await listSeriesRows(db, c.get("organizationId"));
  return c.json(
    { series: eventSeriesSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const createSeries: AuthedRouteHandler<CreateSeriesRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { generateUntil, ...input } = c.req.valid("json");
  const result = await createSeriesRow(db, caller, input, generateUntil);
  return c.json(
    {
      created: result.created,
      series: eventSeriesSelectSchema.parse(result.series),
    },
    HttpStatusCodes.CREATED
  );
};

export const updateSeries: AuthedRouteHandler<UpdateSeriesRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const row = await updateSeriesRow(db, caller, id, c.req.valid("json"));
  return c.json(eventSeriesSelectSchema.parse(row), HttpStatusCodes.OK);
};

export const extendSeries: AuthedRouteHandler<ExtendSeriesRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const { until } = c.req.valid("json");
  const result = await extendSeriesRows(db, caller, id, until);
  return c.json({ created: result.created }, HttpStatusCodes.OK);
};
