import { and, eq } from "drizzle-orm";

import type { Database } from "./create-database";
import type { OnboardingStep } from "./schema/onboarding/onboarding-steps";
import {
  ORGANIZATION_ONBOARDING_STEPS,
  USER_ONBOARDING_STEPS,
  onboardingSteps,
} from "./schema/onboarding/onboarding-steps";

export type OnboardingSubject =
  | { userId: string; organizationId?: undefined }
  | { organizationId: string; userId?: undefined };

export interface OnboardingProgress {
  steps: string[];
  completed: string[];
  /** First step in the list with no row, or null when everything is done. */
  next: string | null;
}

/** Marks a step done. Safe to call again: a second call changes nothing. */
export const completeOnboardingStep = async (
  db: Database,
  subject: OnboardingSubject,
  step: OnboardingStep,
  completedBy?: string
): Promise<void> => {
  await db
    .insert(onboardingSteps)
    .values({
      completedBy,
      organizationId: subject.organizationId,
      step,
      userId: subject.userId,
    })
    .onConflictDoNothing();
};

/** Which steps are done and which comes next, for a user or an organization. */
export const getOnboardingProgress = async (
  db: Database,
  subject: OnboardingSubject
): Promise<OnboardingProgress> => {
  const steps: readonly string[] =
    subject.userId === undefined
      ? ORGANIZATION_ONBOARDING_STEPS
      : USER_ONBOARDING_STEPS;
  const rows = await db
    .select({ step: onboardingSteps.step })
    .from(onboardingSteps)
    .where(
      subject.userId === undefined
        ? and(eq(onboardingSteps.organizationId, subject.organizationId))
        : eq(onboardingSteps.userId, subject.userId)
    );
  const done = new Set<string>(rows.map((row) => row.step));
  return {
    completed: steps.filter((step) => done.has(step)),
    next: steps.find((step) => !done.has(step)) ?? null,
    steps: [...steps],
  };
};
