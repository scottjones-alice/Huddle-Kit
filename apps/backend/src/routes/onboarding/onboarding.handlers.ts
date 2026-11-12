import { isBillingManager } from "@alice/authentication";
import {
  completeOnboardingStep,
  getOnboardingProgress,
  onboardingDrafts,
} from "@alice/database";
import { z } from "@hono/zod-openapi";
import { and, eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { db } from "@/services/database";
import { draftEncryptor } from "@/services/draft-encryptor";
import type { AuthedRouteHandler } from "@/types";

import { MAX_DRAFT_JSON_BYTES } from "./onboarding.route";
import type {
  CompleteOrganizationRoute,
  CompleteUserRoute,
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

export const completeUser: AuthedRouteHandler<CompleteUserRoute> = async (
  c
) => {
  const { step } = c.req.valid("param");
  const userId = c.get("userId");
  await completeOnboardingStep(db, { userId }, step, userId);
  return c.json(
    await getOnboardingProgress(db, { userId }),
    HttpStatusCodes.OK
  );
};

export const completeOrganization: AuthedRouteHandler<
  CompleteOrganizationRoute
> = async (c) => {
  const { step } = c.req.valid("param");
  const organizationId = c.get("organizationId");
  const userId = c.get("userId");
  if (!(await isBillingManager(db, { organizationId, userId }))) {
    return c.json(
      { message: "Only a club owner or admin can do this" },
      HttpStatusCodes.FORBIDDEN
    );
  }
  await completeOnboardingStep(db, { organizationId }, step, userId);
  return c.json(
    await getOnboardingProgress(db, { organizationId }),
    HttpStatusCodes.OK
  );
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
      set: { data: encrypted, stepId, updatedAt },
      target: [onboardingDrafts.userId, onboardingDrafts.flow],
    });
  return c.json(
    { data, stepId, updatedAt: updatedAt.toISOString() },
    HttpStatusCodes.OK
  );
};
