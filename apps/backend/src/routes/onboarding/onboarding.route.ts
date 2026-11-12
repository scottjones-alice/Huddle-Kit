import {
  ONBOARDING_FLOWS,
  ORGANIZATION_ONBOARDING_STEPS,
  USER_ONBOARDING_STEPS,
} from "@alice/database";
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
const userStepSchema = z.enum(USER_ONBOARDING_STEPS).exclude(["billing"]);
const organizationStepSchema = z
  .enum(ORGANIZATION_ONBOARDING_STEPS)
  .exclude(["billing", "payouts", "team"]);

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

export const completeUser = createRoute({
  method: "post",
  path: "/onboarding/user/{step}",
  request: {
    params: z.object({
      step: userStepSchema,
    }),
  },
  responses: { [HttpStatusCodes.OK]: jsonContent(progressSchema, "Progress.") },
  tags: TAGS,
});

export const completeOrganization = createRoute({
  method: "post",
  path: "/onboarding/organization/{step}",
  request: {
    params: z.object({
      step: organizationStepSchema,
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(progressSchema, "Progress."),
    [HttpStatusCodes.FORBIDDEN]: forbidden,
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
export type CompleteUserRoute = typeof completeUser;
export type CompleteOrganizationRoute = typeof completeOrganization;
export type GetDraftRoute = typeof getDraft;
export type SaveDraftRoute = typeof saveDraft;
