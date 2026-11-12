/**
 * Which onboarding steps have been finished. A row means "this step is done",
 * so a missing row means it is still to do and nobody needs a status column.
 * That is also what lets a person resume: the next step is the first one in
 * the list with no row.
 *
 * Each row belongs to exactly one subject. User steps are personal (filling in
 * a profile); organization steps are the club's (payments, billing) and record
 * which member finished them.
 *
 * The step names are fixed lists, checked here and in the Zod schemas. To add a
 * step, add its name to the list below and generate a migration.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations, users } from "../authentication";
import { isOneOf } from "../shared/constraints";

/** Steps a person finishes for themselves. */
export const USER_ONBOARDING_STEPS = [
  // The founder's own details while setting up a club.
  "you",
  "emergency",
  "safeguarding",
  // The people wizard (staff, players and parents joining a club).
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
] as const;
export type UserOnboardingStep = (typeof USER_ONBOARDING_STEPS)[number];

/** Steps a club finishes together. */
export const ORGANIZATION_ONBOARDING_STEPS = [
  "club",
  "location",
  "governance",
  "schedule",
  "fees",
  // Complete on their own: Stripe Connect active, a member invited, a subscription paid.
  "payouts",
  "team",
  "billing",
  "social",
] as const;
export type OrganizationOnboardingStep =
  (typeof ORGANIZATION_ONBOARDING_STEPS)[number];

// "billing" and "social" exist for both kinds of subject, so the union is de-duplicated.
export const ONBOARDING_STEPS = [
  ...new Set([...USER_ONBOARDING_STEPS, ...ORGANIZATION_ONBOARDING_STEPS]),
];
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const onboardingSteps = pgTable(
  "onboarding_steps",
  {
    completedAt: timestamp("completed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // For a club step: the member who finished it. Cleared if that user is deleted.
    completedBy: uuid("completed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    // Set for a club step, empty for a user step.
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    step: text("step").$type<OnboardingStep>().notNull(),
    // Set for a user step, empty for a club step.
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [
    // Exactly one subject, and a step name that belongs to that kind of subject.
    check(
      "onboarding_steps_subject_chk",
      sql`(${table.userId} is not null and ${table.organizationId} is null and ${isOneOf(table.step, USER_ONBOARDING_STEPS)})
        or (${table.organizationId} is not null and ${table.userId} is null and ${isOneOf(table.step, ORGANIZATION_ONBOARDING_STEPS)})`
    ),
    // A step is finished at most once per person or club.
    uniqueIndex("onboarding_steps_userId_step_uidx")
      .on(table.userId, table.step)
      .where(sql`${table.userId} is not null`),
    uniqueIndex("onboarding_steps_organizationId_step_uidx")
      .on(table.organizationId, table.step)
      .where(sql`${table.organizationId} is not null`),
    index("onboarding_steps_completedBy_idx").on(table.completedBy),
  ]
);

/**
 * Only the step's own relations are declared. Parts merge per table, so adding
 * `onboardingSteps` to `users` or `organizations` here would replace theirs.
 */
export const onboardingStepsRelations = defineRelationsPart(
  { onboardingSteps, organizations, users },
  (r) => ({
    onboardingSteps: {
      completedByUser: r.one.users({
        from: r.onboardingSteps.completedBy,
        to: r.users.id,
      }),
      organization: r.one.organizations({
        from: r.onboardingSteps.organizationId,
        to: r.organizations.id,
      }),
      user: r.one.users({
        from: r.onboardingSteps.userId,
        to: r.users.id,
      }),
    },
  })
);
