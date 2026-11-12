import { isBillingManager } from "@alice/authentication";
import {
  completeOnboardingStep,
  getOnboardingProgress,
  onboardingDrafts,
} from "@alice/database";
import { z } from "@hono/zod-openapi";
import { and, eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import {
  SlugTakenError,
  clubStepInputSchema,
  saveClubStep,
} from "@/services/club-onboarding";
import { db } from "@/services/database";
import { draftEncryptor } from "@/services/draft-encryptor";
import {
  NotYourChildError,
  memberStepInputSchema,
  saveMemberStep,
} from "@/services/member-onboarding";
import type { AuthedRouteHandler } from "@/types";

import { MAX_DRAFT_JSON_BYTES } from "./onboarding.route";
import type {
  SaveClubStepRoute,
  SaveMemberStepRoute,
  FinishDraftRoute,
  GetDraftRoute,
  GetRoute,
  SaveDraftRoute,
} from "./onboarding.route";

export const get: AuthedRouteHandler<GetRoute> = async (c) => {
  const [user, organization] = await Promise.all([
    getOnboardingProgress(db, { userId: c.get("userId") }),
    getOnboardingProgress(db, { organizationId: c.get("organizationId") }),
  ]);
  return c.json({ organization, user }, HttpStatusCodes.OK);
};

const draftDataSchema = z.record(z.string(), z.unknown());
const draftContext = (userId: string) => `${userId}:onboarding_drafts.data`;

export const getDraft: AuthedRouteHandler<GetDraftRoute> = async (c) => {
  const { flow } = c.req.valid("param");
  const userId = c.get("userId");
  const [row] = await db
    .select()
    .from(onboardingDrafts)
    .where(
      and(eq(onboardingDrafts.userId, userId), eq(onboardingDrafts.flow, flow))
    );
  if (row === undefined) {
    return c.json({ message: "No draft saved" }, HttpStatusCodes.NOT_FOUND);
  }
  const data = draftDataSchema.parse(
    JSON.parse(draftEncryptor.decrypt(row.data, draftContext(userId)))
  );
  return c.json(
    { data, stepId: row.stepId, updatedAt: row.updatedAt.toISOString() },
    HttpStatusCodes.OK
  );
};

export const saveDraft: AuthedRouteHandler<SaveDraftRoute> = async (c) => {
  const { flow } = c.req.valid("param");
  const { data, stepId } = c.req.valid("json");
  const userId = c.get("userId");
  const json = JSON.stringify(data);
  if (Buffer.byteLength(json) > MAX_DRAFT_JSON_BYTES) {
    return c.json(
      { message: "Draft is too large" },
      HttpStatusCodes.REQUEST_TOO_LONG
    );
  }
  const encrypted = draftEncryptor.encrypt(json, draftContext(userId));
  const updatedAt = new Date();
  await db
    .insert(onboardingDrafts)
    .values({ data: encrypted, flow, stepId, updatedAt, userId })
    .onConflictDoUpdate({
      set: {
        data: encrypted,
        lastRemindedAt: null,
        remindersSent: 0,
        stepId,
        updatedAt,
      },
      target: [onboardingDrafts.userId, onboardingDrafts.flow],
    });
  return c.json(
    { data, stepId, updatedAt: updatedAt.toISOString() },
    HttpStatusCodes.OK
  );
};

export const saveClub: AuthedRouteHandler<SaveClubStepRoute> = async (c) => {
  const { step } = c.req.valid("param");
  const organizationId = c.get("organizationId");
  const userId = c.get("userId");
  if (!(await isBillingManager(db, { organizationId, userId }))) {
    return c.json(
      { message: "Only a club owner or admin can do this" },
      HttpStatusCodes.FORBIDDEN
    );
  }
  const parsed = clubStepInputSchema.safeParse({
    data: c.req.valid("json"),
    step,
  });
  if (!parsed.success) {
    return c.json(
      {
        issues: parsed.error.issues.map((issue) => ({
          message: issue.message,
          path: issue.path.join("."),
        })),
        message: "Some fields are not valid",
      },
      HttpStatusCodes.UNPROCESSABLE_ENTITY
    );
  }
  try {
    await saveClubStep(db, organizationId, parsed.data);
  } catch (error) {
    if (error instanceof SlugTakenError) {
      return c.json({ message: error.message }, HttpStatusCodes.CONFLICT);
    }
    throw error;
  }
  await completeOnboardingStep(db, { organizationId }, step, userId);
  return c.json(
    await getOnboardingProgress(db, { organizationId }),
    HttpStatusCodes.OK
  );
};

const MEMBER_STEP_DATA = {
  emergency: "safety",
  safeguarding: "dbs",
  you: "details",
} as const;

export const saveMember: AuthedRouteHandler<SaveMemberStepRoute> = async (
  c
) => {
  const { step } = c.req.valid("param");
  const organizationId = c.get("organizationId");
  const userId = c.get("userId");
  const dataStep =
    step === "you" || step === "emergency" || step === "safeguarding"
      ? MEMBER_STEP_DATA[step]
      : step;
  const parsed = memberStepInputSchema.safeParse({
    data: c.req.valid("json"),
    step: dataStep,
  });
  if (!parsed.success) {
    return c.json(
      {
        issues: parsed.error.issues.map((issue) => ({
          message: issue.message,
          path: issue.path.join("."),
        })),
        message: "Some fields are not valid",
      },
      HttpStatusCodes.UNPROCESSABLE_ENTITY
    );
  }
  try {
    await saveMemberStep(db, { organizationId, userId }, parsed.data);
  } catch (error) {
    if (error instanceof NotYourChildError) {
      return c.json({ message: error.message }, HttpStatusCodes.FORBIDDEN);
    }
    throw error;
  }
  await completeOnboardingStep(db, { userId }, step, userId);
  return c.json(
    await getOnboardingProgress(db, { userId }),
    HttpStatusCodes.OK
  );
};

export const finishDraft: AuthedRouteHandler<FinishDraftRoute> = async (c) => {
  const { flow } = c.req.valid("param");
  await db
    .delete(onboardingDrafts)
    .where(
      and(
        eq(onboardingDrafts.userId, c.get("userId")),
        eq(onboardingDrafts.flow, flow)
      )
    );
  return c.body(null, HttpStatusCodes.NO_CONTENT);
};
