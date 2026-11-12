import {
  ATTENDANCE_STATUSES,
  AVAILABILITY_STATUSES,
  EVENT_KINDS,
  EVENT_STATUSES,
  HOME_AWAY_VALUES,
  SQUAD_ROLES,
} from "@alice/database";
import {
  eventAttendanceSelectSchema,
  eventAvailabilitySelectSchema,
  eventSelectSchema,
  eventSeriesSelectSchema,
  matchDetailSelectSchema,
  matchSquadSelectSchema,
} from "@alice/database/validation";
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import {
  errorBody,
  idParams,
  invalidBody,
  notFoundBody,
  pageQuery,
  sessionErrors,
} from "@/lib/route-kit";

const TAGS = ["Events"];

const when = z.iso.datetime({ offset: true });

const matchBody = z.object({
  competition: z.string().trim().max(120).nullish(),
  homeAway: z.enum(HOME_AWAY_VALUES),
  opponentId: z.uuid(),
});

const matchChanges = matchBody.partial().extend({
  goalsAgainst: z.number().int().min(0).max(99).nullish(),
  goalsFor: z.number().int().min(0).max(99).nullish(),
});

const eventDetail = eventSelectSchema.extend({
  match: matchDetailSelectSchema.nullable(),
});

const eventBody = z.object({
  description: z.string().trim().max(2000).nullish(),
  endsAt: when,
  kind: z.enum(EVENT_KINDS),
  match: matchBody.optional().describe("Only for a match."),
  meetAt: when.nullish().describe("When to arrive, if earlier than the start."),
  startsAt: when,
  teamId: z
    .uuid()
    .nullish()
    .describe("Leave out for a club-wide event. Club admins only."),
  title: z.string().trim().min(1).max(200),
  venueId: z.uuid().nullish(),
});

const eventChanges = z.object({
  cancellationReason: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .nullish()
    .describe("Why. Needed when the status becomes cancelled."),
  description: z.string().trim().max(2000).nullish(),
  endsAt: when.optional(),
  match: matchChanges
    .optional()
    .describe("Opponent and, once played, the score."),
  meetAt: when.nullish(),
  startsAt: when.optional(),
  status: z
    .enum(EVENT_STATUSES)
    .optional()
    .describe(
      "Events are never deleted. Cancel or postpone them and the record stays."
    ),
  title: z.string().trim().min(1).max(200).optional(),
  venueId: z.uuid().nullish(),
});

const listQuery = pageQuery.extend({
  from: when.optional().describe("Only events that start at or after this."),
  kind: z.enum(EVENT_KINDS).optional().describe("Only this kind of event."),
  status: z.enum(EVENT_STATUSES).optional().describe("Only this status."),
  teamId: z.uuid().optional().describe("Only this team's events."),
  to: when.optional().describe("Only events that start before this."),
});

const availabilityBody = z.object({
  note: z.string().trim().max(300).nullish(),
  personId: z
    .uuid()
    .optional()
    .describe("Who is answering. Defaults to the caller's own person."),
  status: z.enum(AVAILABILITY_STATUSES),
});

const attendanceBody = z.object({
  records: z
    .array(
      z.object({
        note: z.string().trim().max(300).nullish(),
        personId: z.uuid(),
        status: z.enum(ATTENDANCE_STATUSES),
      })
    )
    .min(1)
    .max(200),
});

const squadBody = z.object({
  squad: z
    .array(
      z.object({
        goals: z.number().int().min(0).max(99).optional(),
        minutesPlayed: z.number().int().min(0).max(300).nullish(),
        personId: z.uuid(),
        position: z.string().trim().max(40).nullish(),
        role: z.enum(SQUAD_ROLES),
        shirtNumber: z.number().int().min(0).max(999).nullish(),
      })
    )
    .max(60),
});

const seriesBody = z.object({
  description: z.string().trim().max(2000).nullish(),
  durationMinutes: z.number().int().min(5).max(1440),
  endsOn: z.iso.date().nullish(),
  generateUntil: z.iso
    .date()
    .optional()
    .describe("Make events up to this date. Defaults to 12 weeks ahead."),
  intervalWeeks: z.number().int().min(1).max(52).optional(),
  kind: z.enum(EVENT_KINDS),
  meetMinutesBefore: z.number().int().min(0).max(240).nullish(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}(?<seconds>:\d{2})?$/u)
    .describe("Local time of day, like 18:30."),
  startsOn: z.iso.date(),
  teamId: z.uuid().nullish(),
  timeZone: z.string().min(1).max(64).describe("For example Europe/London."),
  title: z.string().trim().min(1).max(200),
  venueId: z.uuid().nullish(),
  weekday: z.number().int().min(1).max(7).describe("1 is Monday, 7 is Sunday."),
});

const seriesChanges = z.object({
  endsOn: z.iso.date().nullish(),
  isActive: z
    .boolean()
    .optional()
    .describe("false stops the series. Events already made are kept."),
});

export const listEvents = createRoute({
  description: "Everyone in the club can see the calendar, soonest first.",
  method: "get",
  operationId: "listEvents",
  path: "/events",
  request: { query: listQuery },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ events: z.array(eventSelectSchema) }),
      "The events."
    ),
    ...sessionErrors,
  },
  summary: "List events",
  tags: TAGS,
});

export const createEvent = createRoute({
  description:
    "Adds a training, match or other event. Coaches can add events for their own teams; club admins can add any, including club-wide ones.",
  method: "post",
  operationId: "createEvent",
  path: "/events",
  request: { body: jsonContentRequired(eventBody, "The event.") },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(eventDetail, "The new event."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("team, venue or opponent"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Add an event",
  tags: TAGS,
});

export const getEvent = createRoute({
  method: "get",
  operationId: "getEvent",
  path: "/events/{id}",
  request: { params: idParams("event") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(eventDetail, "The event."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("event"),
    ...sessionErrors,
  },
  summary: "Get an event",
  tags: TAGS,
});

export const updateEvent = createRoute({
  description:
    "Changes the time or place, cancels or postpones, or records the result. Events are never deleted.",
  method: "patch",
  operationId: "updateEvent",
  path: "/events/{id}",
  request: {
    body: jsonContentRequired(eventChanges, "The fields to change."),
    params: idParams("event"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(eventDetail, "The updated event."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("event"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Change, cancel or score an event",
  tags: TAGS,
});

export const setAvailability = createRoute({
  description:
    "Says whether someone can make it. You can answer for yourself and your children; club admins can answer for anyone. Answering again changes the answer.",
  method: "put",
  operationId: "setAvailability",
  path: "/events/{id}/availability",
  request: {
    body: jsonContentRequired(availabilityBody, "The answer."),
    params: idParams("event"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      eventAvailabilitySelectSchema,
      "The saved answer."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("event or person"),
    ...sessionErrors,
  },
  summary: "Say if you can make it",
  tags: TAGS,
});

export const listAvailability = createRoute({
  description:
    "The team's coaches see every answer. Everyone else sees their own and their children's.",
  method: "get",
  operationId: "listAvailability",
  path: "/events/{id}/availability",
  request: { params: idParams("event") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ availability: z.array(eventAvailabilitySelectSchema) }),
      "The answers."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("event"),
    ...sessionErrors,
  },
  summary: "Who can make it",
  tags: TAGS,
});

export const recordAttendance = createRoute({
  description:
    "Records who turned up. Coaches of the team and club admins only. Saving a person again changes their earlier mark.",
  method: "put",
  operationId: "recordAttendance",
  path: "/events/{id}/attendance",
  request: {
    body: jsonContentRequired(attendanceBody, "Who was there."),
    params: idParams("event"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ attendance: z.array(eventAttendanceSelectSchema) }),
      "Everyone marked so far."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("event or person"),
    ...sessionErrors,
  },
  summary: "Record attendance",
  tags: TAGS,
});

export const listAttendance = createRoute({
  description: "Coaches of the team and club admins only.",
  method: "get",
  operationId: "listAttendance",
  path: "/events/{id}/attendance",
  request: { params: idParams("event") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ attendance: z.array(eventAttendanceSelectSchema) }),
      "Everyone marked."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("event"),
    ...sessionErrors,
  },
  summary: "See attendance",
  tags: TAGS,
});

export const setSquad = createRoute({
  description:
    "Picks the match squad. Sending the list again replaces the earlier pick. Coaches of the team and club admins only.",
  method: "put",
  operationId: "setSquad",
  path: "/events/{id}/squad",
  request: {
    body: jsonContentRequired(squadBody, "The squad."),
    params: idParams("match"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ squad: z.array(matchSquadSelectSchema) }),
      "The squad."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("match or person"),
    [HttpStatusCodes.CONFLICT]: errorBody("A person is listed twice."),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Pick the squad",
  tags: TAGS,
});

export const getSquad = createRoute({
  method: "get",
  operationId: "getSquad",
  path: "/events/{id}/squad",
  request: { params: idParams("match") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ squad: z.array(matchSquadSelectSchema) }),
      "The squad."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("match"),
    ...sessionErrors,
  },
  summary: "See the squad",
  tags: TAGS,
});

export const listSeries = createRoute({
  description: "Repeating sessions, such as training every Tuesday.",
  method: "get",
  operationId: "listEventSeries",
  path: "/event-series",
  request: {},
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ series: z.array(eventSeriesSelectSchema) }),
      "The series."
    ),
    ...sessionErrors,
  },
  summary: "List repeating events",
  tags: TAGS,
});

export const createSeries = createRoute({
  description:
    "Creates a repeating weekly event and makes its first events. Coaches for their own teams; club admins for any.",
  method: "post",
  operationId: "createEventSeries",
  path: "/event-series",
  request: { body: jsonContentRequired(seriesBody, "The pattern.") },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({
        created: z.number().int().describe("How many events were made."),
        series: eventSeriesSelectSchema,
      }),
      "The series and how many events it made."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("team or venue"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Add a repeating event",
  tags: TAGS,
});

export const updateSeries = createRoute({
  description: "Stops a series or sets when it ends. Events already made stay.",
  method: "patch",
  operationId: "updateEventSeries",
  path: "/event-series/{id}",
  request: {
    body: jsonContentRequired(seriesChanges, "The fields to change."),
    params: idParams("series"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(eventSeriesSelectSchema, "The series."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("series"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Stop or end a repeating event",
  tags: TAGS,
});

export const extendSeries = createRoute({
  description:
    "Makes the events for a series up to a date. Safe to repeat: events that exist are skipped.",
  method: "post",
  operationId: "extendEventSeries",
  path: "/event-series/{id}/generate",
  request: {
    body: jsonContentRequired(
      z.object({
        until: z.iso.date().describe("Make events up to this date."),
      }),
      "How far ahead."
    ),
    params: idParams("series"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ created: z.number().int() }),
      "How many events were made."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("series"),
    ...sessionErrors,
  },
  summary: "Make more events",
  tags: TAGS,
});

export type ListEventsRoute = typeof listEvents;
export type CreateEventRoute = typeof createEvent;
export type GetEventRoute = typeof getEvent;
export type UpdateEventRoute = typeof updateEvent;
export type SetAvailabilityRoute = typeof setAvailability;
export type ListAvailabilityRoute = typeof listAvailability;
export type RecordAttendanceRoute = typeof recordAttendance;
export type ListAttendanceRoute = typeof listAttendance;
export type SetSquadRoute = typeof setSquad;
export type GetSquadRoute = typeof getSquad;
export type ListSeriesRoute = typeof listSeries;
export type CreateSeriesRoute = typeof createSeries;
export type UpdateSeriesRoute = typeof updateSeries;
export type ExtendSeriesRoute = typeof extendSeries;
