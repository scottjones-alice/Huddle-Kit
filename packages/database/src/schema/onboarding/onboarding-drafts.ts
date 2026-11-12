/**
 * A half-finished onboarding form, so "Save and finish later" can resume where
 * someone stopped. The form holds children's medical and contact details, so
 * `data` is never plain JSON: it is the output of the field encryptor
 * (context `${userId}:onboarding_drafts.data`). One draft per person per flow.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  check,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "../authentication";
import { isOneOf } from "../shared/constraints";

export const ONBOARDING_FLOWS = ["club", "people"] as const;
export type OnboardingFlow = (typeof ONBOARDING_FLOWS)[number];

export const onboardingDrafts = pgTable(
  "onboarding_drafts",
  {
    // Encrypted JSON of the form values. Never store this unencrypted.
    data: text("data").notNull(),
    flow: text("flow").$type<OnboardingFlow>().notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    // The wizard step to resume on.
    stepId: text("step_id").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    check("onboarding_drafts_flow_chk", isOneOf(table.flow, ONBOARDING_FLOWS)),
    uniqueIndex("onboarding_drafts_userId_flow_uidx").on(
      table.userId,
      table.flow
    ),
  ]
);

export const onboardingDraftsRelations = defineRelationsPart(
  { onboardingDrafts, users },
  (r) => ({
    onboardingDrafts: {
      user: r.one.users({
        from: r.onboardingDrafts.userId,
        to: r.users.id,
      }),
    },
  })
);
