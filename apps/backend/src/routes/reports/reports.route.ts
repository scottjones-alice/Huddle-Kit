import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";

import { sessionErrors } from "@/lib/route-kit";

const TAGS = ["Reports"];

const when = z.iso.datetime({ offset: true });

const summaryBody = z.object({
  activePeople: z.number().int(),
  activeTeams: z.number().int(),
  pendingRegistrations: z
    .number()
    .int()
    .describe("Waiting for an admin to accept."),
  upcomingEvents: z.number().int().describe("Scheduled and still to come."),
});

const financeRow = z.object({
  charged: z
    .number()
    .int()
    .describe(
      "Total charged, in pence or cents, not counting cancelled charges."
    ),
  charges: z.number().int().describe("How many charges were made."),
  currency: z.string(),
  feeId: z.uuid(),
  name: z.string(),
  outstanding: z
    .number()
    .int()
    .describe("Still owed: charged, less waived, less paid."),
  paid: z.number().int().describe("Money received so far."),
  waived: z.number().int().describe("Written off for hardship."),
});

const attendanceRow = z.object({
  absent: z.number().int(),
  excused: z.number().int(),
  firstName: z.string(),
  lastName: z.string(),
  late: z.number().int(),
  personId: z.uuid(),
  present: z.number().int(),
});

export const clubSummary = createRoute({
  description:
    "Club admins only. Contains no safeguarding or health information.",
  method: "get",
  operationId: "getClubSummary",
  path: "/reports/club-summary",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(summaryBody, "The summary."),
    ...sessionErrors,
  },
  summary: "Club at a glance",
  tags: TAGS,
});

export const financeSummary = createRoute({
  description:
    "Per fee: charged, paid, waived and outstanding. Club admins and the treasurer only.",
  method: "get",
  operationId: "getFinanceSummary",
  path: "/reports/finance",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ fees: z.array(financeRow) }),
      "One row per fee."
    ),
    ...sessionErrors,
  },
  summary: "Money in and owed",
  tags: TAGS,
});

export const attendanceSummary = createRoute({
  description:
    "How often each person turned up to a team's events. Coaches of the team and club admins only.",
  method: "get",
  operationId: "getAttendanceSummary",
  path: "/reports/attendance",
  request: {
    query: z.object({
      from: when.optional().describe("Only events at or after this."),
      teamId: z.uuid().describe("The team."),
      to: when.optional().describe("Only events before this."),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ people: z.array(attendanceRow) }),
      "One row per person."
    ),
    ...sessionErrors,
  },
  summary: "Team attendance",
  tags: TAGS,
});

export type ClubSummaryRoute = typeof clubSummary;
export type FinanceSummaryRoute = typeof financeSummary;
export type AttendanceSummaryRoute = typeof attendanceSummary;
