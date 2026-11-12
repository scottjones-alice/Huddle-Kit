import { ONBOARDING_FLOWS } from "@alice/database";
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

const TAGS = ["Onboarding"];
const MAX_DRAFT_BYTES = 200_000;

const progressSchema = z.object({
  completed: z.array(z.string()),
  next: z.string().nullable(),
  steps: z.array(z.string()),
});

const errorSchema = z.object({ message: z.string() });
const forbidden = jsonContent(
  errorSchema,
  "Only a club owner or admin can do this."
);

// Steps a client can mark done. The rest complete on their own: Connect becomes
// active (payouts), a member is invited (team), a subscription is paid (billing).

const CLUB_STEPS = [
  "club",
  "location",
  "governance",
  "schedule",
  "fees",
  "social",
] as const;

const draftBody = z.object({
  data: z.record(z.string(), z.unknown()),
  stepId: z.string().min(1).max(64),
});
const draftSchema = draftBody.extend({ updatedAt: z.string() });

export const get = createRoute({
  description: "Onboarding progress for the signed-in user and active club.",
  method: "get",
  path: "/onboarding",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ organization: progressSchema, user: progressSchema }),
      "Progress."
    ),
  },
  tags: TAGS,
});

export const saveClubStep = createRoute({
  description:
    "Saves one club wizard step (club, location, governance, schedule, fees or social) and marks it done. The body is that step's fields. Owners and admins only.",
  method: "put",
  path: "/onboarding/club/{step}",
  request: {
    body: jsonContentRequired(
      z.record(z.string(), z.unknown()),
      "The step's fields."
    ),
    params: z.object({ step: z.enum(CLUB_STEPS) }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(progressSchema, "Progress."),
    [HttpStatusCodes.FORBIDDEN]: forbidden,
    [HttpStatusCodes.CONFLICT]: jsonContent(errorSchema, "Club address taken."),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      z.object({
        issues: z.array(z.object({ message: z.string(), path: z.string() })),
        message: z.string(),
      }),
      "The fields are not valid."
    ),
  },
  tags: TAGS,
});

/** The founder's own steps in the club wizard reuse the people wizard's saves. */
export const MEMBER_STEPS = [
  "role",
  "details",
  "address",
  "safety",
  "dbs",
  "availability",
  "children",
  "permissions",
  "billing",
  "social",
  "you",
  "emergency",
  "safeguarding",
] as const;

export const saveMemberStep = createRoute({
  description:
    "Saves one people-wizard step for the signed-in person and their own children, and marks it done. `you`, `emergency` and `safeguarding` (the club founder's steps) save the same data as `details`, `safety` and `dbs`.",
  method: "put",
  path: "/onboarding/member/{step}",
  request: {
    body: jsonContentRequired(
      z.record(z.string(), z.unknown()),
      "The step's fields."
    ),
    params: z.object({ step: z.enum(MEMBER_STEPS) }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(progressSchema, "Progress."),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      errorSchema,
      "A child in the request is not yours."
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      z.object({
        issues: z.array(z.object({ message: z.string(), path: z.string() })),
        message: z.string(),
      }),
      "The fields are not valid."
    ),
  },
  tags: TAGS,
});

export const getDraft = createRoute({
  description: "The saved draft for a flow, or 404 when there is none.",
  method: "get",
  path: "/onboarding/draft/{flow}",
  request: { params: z.object({ flow: z.enum(ONBOARDING_FLOWS) }) },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(draftSchema, "The draft."),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(errorSchema, "No draft saved."),
  },
  tags: TAGS,
});

export const saveDraft = createRoute({
  description:
    "Saves the form so far, encrypted. Replaces any earlier draft for the flow.",
  method: "put",
  path: "/onboarding/draft/{flow}",
  request: {
    body: jsonContentRequired(draftBody, "The form values and current step."),
    params: z.object({ flow: z.enum(ONBOARDING_FLOWS) }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(draftSchema, "The saved draft."),
    [HttpStatusCodes.REQUEST_TOO_LONG]: jsonContent(errorSchema, "Too large."),
  },
  tags: TAGS,
});

export const MAX_DRAFT_JSON_BYTES = MAX_DRAFT_BYTES;
export type GetRoute = typeof get;
export type SaveMemberStepRoute = typeof saveMemberStep;
export type SaveClubStepRoute = typeof saveClubStep;
export type GetDraftRoute = typeof getDraft;
export type SaveDraftRoute = typeof saveDraft;
