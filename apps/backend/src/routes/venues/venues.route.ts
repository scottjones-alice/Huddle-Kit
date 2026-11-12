import {
  addressSelectSchema,
  pitchInsertSchema,
  pitchSelectSchema,
  venueInsertSchema,
  venueSelectSchema,
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
import { addressInputSchema } from "@/lib/schemas";

const TAGS = ["Venues"];

const venueSchema = venueSelectSchema.extend({ address: addressSelectSchema });

const venueBody = z.object({
  address: addressInputSchema,
  directions: venueInsertSchema.shape.directions,
  kinds: venueInsertSchema.shape.kinds,
  name: venueInsertSchema.shape.name,
  what3words: venueInsertSchema.shape.what3words,
});

const venueChanges = venueBody.partial().extend({
  isActive: z
    .boolean()
    .optional()
    .describe("false archives the venue, true brings it back."),
});

const pitchBody = z.object({
  format: pitchInsertSchema.shape.format,
  name: pitchInsertSchema.shape.name,
  surface: pitchInsertSchema.shape.surface,
  venueId: z.uuid().describe("The venue this pitch is at."),
});

const pitchChanges = pitchBody
  .omit({ venueId: true })
  .partial()
  .extend({
    isActive: z
      .boolean()
      .optional()
      .describe("false archives the pitch, true brings it back."),
  });

const pitchListQuery = includeArchivedQuery.extend({
  venueId: z.uuid().optional().describe("Only pitches at this venue."),
});

export const listVenues = createRoute({
  description: "The club's venues with their addresses, A to Z.",
  method: "get",
  operationId: "listVenues",
  path: "/venues",
  request: { query: includeArchivedQuery },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ venues: z.array(venueSchema) }),
      "The venues."
    ),
    ...sessionErrors,
  },
  summary: "List venues",
  tags: TAGS,
});

export const createVenue = createRoute({
  description: "Adds a venue and its address. Owners and admins only.",
  method: "post",
  operationId: "createVenue",
  path: "/venues",
  request: { body: jsonContentRequired(venueBody, "The venue.") },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(venueSchema, "The new venue."),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Add a venue",
  tags: TAGS,
});

export const getVenue = createRoute({
  description: "One venue with its address.",
  method: "get",
  operationId: "getVenue",
  path: "/venues/{id}",
  request: { params: idParams("venue") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(venueSchema, "The venue."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("venue"),
    ...sessionErrors,
  },
  summary: "Get a venue",
  tags: TAGS,
});

export const updateVenue = createRoute({
  description:
    "Changes a venue or its address. Send `isActive: false` to archive it: venues are never deleted, because old fixtures point at them. Owners and admins only.",
  method: "patch",
  operationId: "updateVenue",
  path: "/venues/{id}",
  request: {
    body: jsonContentRequired(venueChanges, "The fields to change."),
    params: idParams("venue"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(venueSchema, "The updated venue."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("venue"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Change or archive a venue",
  tags: TAGS,
});

export const listPitches = createRoute({
  description: "Pitches in the club, A to Z, optionally for one venue.",
  method: "get",
  operationId: "listPitches",
  path: "/pitches",
  request: { query: pitchListQuery },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ pitches: z.array(pitchSelectSchema) }),
      "The pitches."
    ),
    ...sessionErrors,
  },
  summary: "List pitches",
  tags: TAGS,
});

export const createPitch = createRoute({
  description: "Adds a pitch to a venue. Owners and admins only.",
  method: "post",
  operationId: "createPitch",
  path: "/pitches",
  request: { body: jsonContentRequired(pitchBody, "The pitch.") },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(pitchSelectSchema, "The new pitch."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("venue"),
    [HttpStatusCodes.CONFLICT]: errorBody(
      "The venue already has a pitch with that name."
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Add a pitch",
  tags: TAGS,
});

export const updatePitch = createRoute({
  description:
    "Changes a pitch, or archives it with `isActive: false`. Owners and admins only.",
  method: "patch",
  operationId: "updatePitch",
  path: "/pitches/{id}",
  request: {
    body: jsonContentRequired(pitchChanges, "The fields to change."),
    params: idParams("pitch"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(pitchSelectSchema, "The updated pitch."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("pitch"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Change or archive a pitch",
  tags: TAGS,
});

export type ListVenuesRoute = typeof listVenues;
export type CreateVenueRoute = typeof createVenue;
export type GetVenueRoute = typeof getVenue;
export type UpdateVenueRoute = typeof updateVenue;
export type ListPitchesRoute = typeof listPitches;
export type CreatePitchRoute = typeof createPitch;
export type UpdatePitchRoute = typeof updatePitch;
