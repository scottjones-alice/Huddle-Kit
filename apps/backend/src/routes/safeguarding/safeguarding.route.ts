import {
  CONCERN_SEVERITIES,
  CONCERN_STATUSES,
  DBS_LEVELS,
  SAFEGUARDING_CHECK_KINDS,
  SAFEGUARDING_CHECK_STATUSES,
} from "@alice/database";
import {
  safeguardingCheckSelectSchema,
  safeguardingConcernSelectSchema,
  safeguardingNoteSelectSchema,
} from "@alice/database/validation";
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import {
  idParams,
  invalidBody,
  notFoundBody,
  sessionErrors,
} from "@/lib/route-kit";

const TAGS = ["Safeguarding"];

const checkQuery = z.object({
  expiresBefore: z.iso
    .date()
    .optional()
    .describe("Only checks that run out on or before this date."),
  kind: z.enum(SAFEGUARDING_CHECK_KINDS).optional().describe("Only this kind."),
  personId: z.uuid().optional().describe("Only this person's checks."),
  status: z
    .enum(SAFEGUARDING_CHECK_STATUSES)
    .optional()
    .describe("Only this status."),
});

const checkBody = z.object({
  dbsLevel: z.enum(DBS_LEVELS).nullish().describe("DBS checks only."),
  dbsUpdateService: z
    .boolean()
    .optional()
    .describe("DBS checks only: on the DBS Update Service."),
  expiresOn: z.iso.date().nullish(),
  fileId: z
    .uuid()
    .nullish()
    .describe("The scanned certificate, uploaded as a file."),
  issuedOn: z.iso.date().nullish(),
  kind: z.enum(SAFEGUARDING_CHECK_KINDS),
  personId: z.uuid().describe("The adult the check is about."),
  reference: z
    .string()
    .trim()
    .max(120)
    .nullish()
    .describe("Certificate number or course reference. Not the certificate."),
});

const checkChanges = z.object({
  expiresOn: z.iso.date().nullish(),
  fileId: z.uuid().nullish(),
  issuedOn: z.iso.date().nullish(),
  reference: z.string().trim().max(120).nullish(),
  status: z
    .enum(SAFEGUARDING_CHECK_STATUSES)
    .optional()
    .describe("Deciding a check records who decided it and when."),
});

const raiseBody = z.object({
  details: z
    .string()
    .trim()
    .max(20_000)
    .nullish()
    .describe("The full account. Stored encrypted."),
  severity: z.enum(CONCERN_SEVERITIES),
  subjectPersonId: z.uuid().describe("Who the concern is about."),
  summary: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .describe("One short line for the people handling it."),
});

const concernQuery = z.object({
  assignedTo: z.uuid().optional().describe("Only concerns given to this user."),
  status: z.enum(CONCERN_STATUSES).optional().describe("Only this status."),
  subjectPersonId: z.uuid().optional().describe("Only this person."),
});

const concernChanges = z.object({
  assignedTo: z.uuid().nullish().describe("The lead handling it."),
  closedReason: z.string().trim().max(1000).nullish(),
  referredTo: z
    .string()
    .trim()
    .max(200)
    .nullish()
    .describe("Who it was passed to, such as the LADO or the County FA."),
  severity: z.enum(CONCERN_SEVERITIES).optional(),
  status: z.enum(CONCERN_STATUSES).optional(),
});

const noteBody = z.object({
  body: z
    .string()
    .trim()
    .min(1)
    .max(20_000)
    .describe("What was done or decided. Stored encrypted."),
});

const noteRow = safeguardingNoteSelectSchema;

export const listChecks = createRoute({
  description:
    "Who has been checked (DBS, safeguarding training, first aid, references) and when it runs out. Club admins and safeguarding staff can read this; only safeguarding staff can change it.",
  method: "get",
  operationId: "listSafeguardingChecks",
  path: "/safeguarding/checks",
  request: { query: checkQuery },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ checks: z.array(safeguardingCheckSelectSchema) }),
      "The checks, soonest to expire first."
    ),
    ...sessionErrors,
  },
  summary: "List safeguarding checks",
  tags: TAGS,
});

export const recordCheck = createRoute({
  description:
    "Records that a check was done. Keep only the certificate number here and the scan in a file. Safeguarding staff only.",
  method: "post",
  operationId: "recordSafeguardingCheck",
  path: "/safeguarding/checks",
  request: { body: jsonContentRequired(checkBody, "The check.") },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      safeguardingCheckSelectSchema,
      "The recorded check."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("person or file"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Record a safeguarding check",
  tags: TAGS,
});

export const updateCheck = createRoute({
  description:
    "Marks a check valid, rejected or revoked, or corrects its dates. Checks are never deleted. Safeguarding staff only.",
  method: "patch",
  operationId: "updateSafeguardingCheck",
  path: "/safeguarding/checks/{id}",
  request: {
    body: jsonContentRequired(checkChanges, "The fields to change."),
    params: idParams("check"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      safeguardingCheckSelectSchema,
      "The updated check."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("check"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Decide or correct a check",
  tags: TAGS,
});

export const raiseConcern = createRoute({
  description:
    "Anyone in the club can raise a concern. Only its id comes back: what you wrote and what happens next is seen by safeguarding staff alone.",
  method: "post",
  operationId: "raiseConcern",
  path: "/safeguarding/concerns",
  request: { body: jsonContentRequired(raiseBody, "The concern.") },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({
        id: z.uuid(),
        openedAt: z.iso.datetime({ offset: true }),
      }),
      "The concern was recorded."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("person"),
    ...sessionErrors,
  },
  summary: "Raise a safeguarding concern",
  tags: TAGS,
});

export const listConcerns = createRoute({
  description:
    "Safeguarding staff only. Shows the short summaries, never the full account. This is recorded in the audit log.",
  method: "get",
  operationId: "listConcerns",
  path: "/safeguarding/concerns",
  request: { query: concernQuery },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ concerns: z.array(safeguardingConcernSelectSchema) }),
      "The concerns, newest first."
    ),
    ...sessionErrors,
  },
  summary: "List concerns",
  tags: TAGS,
});

export const getConcern = createRoute({
  description:
    "One concern in full with its running log. Safeguarding staff only. Every read is recorded in the audit log.",
  method: "get",
  operationId: "getConcern",
  path: "/safeguarding/concerns/{id}",
  request: { params: idParams("concern") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        concern: safeguardingConcernSelectSchema,
        notes: z.array(noteRow),
      }),
      "The concern and its notes."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("concern"),
    ...sessionErrors,
  },
  summary: "Read a concern",
  tags: TAGS,
});

export const updateConcern = createRoute({
  description:
    "Assigns, refers, changes the severity of, closes or reopens a concern. Closing needs a reason. A concern is never deleted.",
  method: "patch",
  operationId: "updateConcern",
  path: "/safeguarding/concerns/{id}",
  request: {
    body: jsonContentRequired(concernChanges, "The fields to change."),
    params: idParams("concern"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      safeguardingConcernSelectSchema,
      "The updated concern."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("concern"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Update a concern",
  tags: TAGS,
});

export const addNote = createRoute({
  description:
    "Adds to the concern's running log. Notes cannot be edited or removed; to correct one, add another.",
  method: "post",
  operationId: "addConcernNote",
  path: "/safeguarding/concerns/{id}/notes",
  request: {
    body: jsonContentRequired(noteBody, "The note."),
    params: idParams("concern"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(noteRow, "The note."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("concern"),
    ...sessionErrors,
  },
  summary: "Add a note to a concern",
  tags: TAGS,
});

export type ListChecksRoute = typeof listChecks;
export type RecordCheckRoute = typeof recordCheck;
export type UpdateCheckRoute = typeof updateCheck;
export type RaiseConcernRoute = typeof raiseConcern;
export type ListConcernsRoute = typeof listConcerns;
export type GetConcernRoute = typeof getConcern;
export type UpdateConcernRoute = typeof updateConcern;
export type AddNoteRoute = typeof addNote;
