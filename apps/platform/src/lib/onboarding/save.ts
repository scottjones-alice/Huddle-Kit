import { APIError } from "@alicesystems-co/huddlekit";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { huddlekit } from "@/lib/huddle-kit";
import { clubPayload, clubSavesForStep } from "@/lib/onboarding/club-steps";
import { memberSavesForStep } from "@/lib/onboarding/member-steps";
import type { MemberPlanOptions } from "@/lib/onboarding/member-steps";

const CONFLICT_STATUS = 409;
const UNPROCESSABLE_STATUS = 422;
const FORBIDDEN_STATUS = 403;

/** The outcome of saving a step. `message` is ready to show to the person. */
export type StepResult =
  | { ok: true }
  | { field?: string; message: string; ok: false };

const SLUG_TAKEN: StepResult = {
  field: "club-slug",
  message: "That club web address is already taken. Try another.",
  ok: false,
};

const GENERIC_FAILURE: StepResult = {
  message: "Something went wrong saving that step. Please try again.",
  ok: false,
};

// API field names, as a person reads them.
const FIELD_LABELS: Record<string, string> = {
  city: "Town or city",
  clubType: "Type of club",
  contactEmail: "Club email",
  contactPhone: "Club phone number",
  foundedYear: "Year founded",
  insuranceExpiresOn: "Insurance expiry date",
  legalStructure: "Legal structure",
  line1: "Address line 1",
  name: "Club name",
  sections: "Club sections",
  slug: "Club web address",
  subscriptionMinor: "Subscription",
  venueName: "Ground or pitch name",
  website: "Website",
};

const validationBodySchema = z.object({
  issues: z.array(z.object({ message: z.string(), path: z.string() })),
});

const describeIssues = (body: unknown): string => {
  const parsed = validationBodySchema.safeParse(body);
  const [first] = parsed.success ? parsed.data.issues : [];
  if (first === undefined) {
    return "Some answers are not valid. Check them and try again.";
  }
  const label = FIELD_LABELS[first.path] ?? first.path;
  return `${label}: ${first.message}`;
};

/** Turns a failed API call into a message a person can act on. */
export const describeSaveError = (error: unknown): StepResult => {
  if (!(error instanceof APIError)) {
    return {
      message:
        "We couldn't reach the server. Check your connection and try again.",
      ok: false,
    };
  }
  if (error.status === CONFLICT_STATUS) {
    return SLUG_TAKEN;
  }
  if (error.status === UNPROCESSABLE_STATUS) {
    return {
      message: describeIssues(error.error),
      ok: false,
    };
  }
  if (error.status === FORBIDDEN_STATUS) {
    return {
      message: "Only the club's owner or an admin can change these details.",
      ok: false,
    };
  }
  return GENERIC_FAILURE;
};

/** Like `describeSaveError`, but a 409 or 403 means something different here. */
const describeMemberError = (error: unknown): StepResult => {
  if (error instanceof APIError && error.status === FORBIDDEN_STATUS) {
    return {
      message: "One of those children is not linked to your account.",
      ok: false,
    };
  }
  if (error instanceof APIError && error.status === CONFLICT_STATUS) {
    return GENERIC_FAILURE;
  }
  return describeSaveError(error);
};

/**
 * Makes sure there is an active club to save into. Every club step needs one,
 * so the first step creates it from the name and web address.
 */
const ensureClub = async (data: FormData): Promise<StepResult> => {
  const { data: session } = await authClient.getSession();
  const activeId = session?.session.activeOrganizationId;
  if (activeId !== undefined && activeId !== null && activeId.length > 0) {
    return { ok: true };
  }
  const { data: clubs } = await authClient.organization.list();
  const [existing] = clubs ?? [];
  if (existing !== undefined) {
    await authClient.organization.setActive({ organizationId: existing.id });
    return { ok: true };
  }
  const { name, slug } = clubPayload(data);
  const { data: created, error } = await authClient.organization.create({
    name,
    slug,
  });
  if (error !== null || created === null) {
    // Better Auth reports a used web address as "organization already exists".
    const code = error?.code ?? "";
    const taken = code.includes("SLUG") || code.includes("ALREADY_EXISTS");
    return taken
      ? SLUG_TAKEN
      : {
          message: error?.message ?? GENERIC_FAILURE.message,
          ok: false,
        };
  }
  await authClient.organization.setActive({ organizationId: created.id });
  return { ok: true };
};

/** Saves what the person entered on a club wizard step. */
export const saveClubStep = async (
  stepId: string,
  data: FormData
): Promise<StepResult> => {
  const saves = clubSavesForStep(stepId, data);
  if (saves.length === 0) {
    return { ok: true };
  }
  try {
    if (stepId === "club") {
      const club = await ensureClub(data);
      if (!club.ok) {
        return club;
      }
    }
    for (const save of saves) {
      // Saved in order: the club step must land before the location step.
      // oxlint-disable-next-line eslint/no-await-in-loop, react-doctor/async-await-in-loop
      await huddlekit.onboarding.saveClubStep(save.step, save.payload);
    }
    return { ok: true };
  } catch (error) {
    return describeSaveError(error);
  }
};

/** Saves what the person entered on a people wizard step. */
export const saveMemberStep = async (
  stepId: string,
  data: FormData,
  options: MemberPlanOptions
): Promise<StepResult> => {
  const plan = memberSavesForStep(stepId, data, options);
  if ("problem" in plan) {
    return { message: plan.problem.message, ok: false };
  }
  try {
    for (const save of plan.saves) {
      // Saved in order: children must exist before their permissions.
      // oxlint-disable-next-line eslint/no-await-in-loop, react-doctor/async-await-in-loop
      await huddlekit.onboarding.saveMemberStep(save.step, save.payload);
    }
    return { ok: true };
  } catch (error) {
    return describeMemberError(error);
  }
};

const draftDataSchema = z.record(
  z.string(),
  z.union([z.string(), z.array(z.string())])
);

/** What the wizard saved for later: the step and the answers so far. */
export interface SavedDraft {
  data: Record<string, string | string[]>;
  stepId: string;
}

/** Form answers as plain text. Uploaded files are left out. */
export const draftData = (form: FormData): SavedDraft["data"] => {
  const result: SavedDraft["data"] = {};
  for (const key of new Set(form.keys())) {
    const values = form
      .getAll(key)
      .filter((value): value is string => typeof value === "string");
    if (values.length > 0) {
      result[key] = values.length === 1 ? (values[0] ?? "") : values;
    }
  }
  return result;
};

export const saveDraft = async (
  flow: "club" | "people",
  stepId: string,
  form: FormData
): Promise<void> => {
  await huddlekit.onboarding.saveDraft(flow, {
    data: draftData(form),
    stepId,
  });
};

/** The saved draft for a wizard, or null when there is none. */
export const loadDraft = async (
  flow: "club" | "people"
): Promise<SavedDraft | null> => {
  try {
    const draft = await huddlekit.onboarding.retrieveDraft(flow);
    const data = draftDataSchema.safeParse(draft.data);
    return data.success ? { data: data.data, stepId: draft.stepId } : null;
  } catch {
    return null;
  }
};

export const finishDraft = async (flow: "club" | "people"): Promise<void> => {
  try {
    await huddlekit.onboarding.finishDraft(flow);
  } catch {
    // The answers are already saved. A leftover draft only sends a reminder email.
  }
};
