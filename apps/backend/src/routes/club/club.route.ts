import {
  clubFeeSettingSelectSchema,
  clubProfileSelectSchema,
  clubSettingsSelectSchema,
  clubSocialLinkSelectSchema,
  clubTrainingSlotSelectSchema,
} from "@alice/database/validation";
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { errorBody, invalidBody, sessionErrors } from "@/lib/route-kit";
import { clubStepInputSchema } from "@/services/club-onboarding";

const TAGS = ["Club"];

const clubOverviewSchema = z.object({
  fees: clubFeeSettingSelectSchema.nullable(),
  organization: z.object({
    id: z.uuid(),
    logo: z.string().nullable(),
    name: z.string(),
    slug: z.string(),
  }),
  profile: clubProfileSelectSchema.nullable(),
  settings: clubSettingsSelectSchema.nullable(),
  socialLinks: z.array(clubSocialLinkSelectSchema),
  trainingSlots: z.array(clubTrainingSlotSelectSchema),
});

export const getClub = createRoute({
  description:
    "The club's name and address, legal and safeguarding details, default fees, social links and training times. Any club member can read it.",
  method: "get",
  operationId: "getClub",
  path: "/club",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(clubOverviewSchema, "The club."),
    ...sessionErrors,
  },
  summary: "Get the club",
  tags: TAGS,
});

export const saveClub = createRoute({
  description:
    "Changes one section of the club: `club` (name, address, type), `location`, `governance` (legal and insurance), `schedule` (training times), `fees` or `social`. Send `{ step, data }`. Owners and admins only.",
  method: "put",
  operationId: "saveClub",
  path: "/club",
  request: {
    body: jsonContentRequired(
      clubStepInputSchema,
      "The section and its fields."
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(clubOverviewSchema, "The updated club."),
    [HttpStatusCodes.CONFLICT]: errorBody("That club address is taken."),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Change the club",
  tags: TAGS,
});

export type GetClubRoute = typeof getClub;
export type SaveClubRoute = typeof saveClub;
