import { onboardingDrafts, users } from "@alice/database";
import type { Database, OnboardingFlow } from "@alice/database";
import { and, eq, lte } from "drizzle-orm";

const MS_PER_HOUR = 3_600_000;

/**
 * When each reminder is due, counted from the last time the draft was saved.
 * `after` is the number already sent; the entry says when the next is due.
 */
export const REMINDER_SCHEDULE = [
  { afterHours: 12, reminder: 1 },
  { afterHours: 24, reminder: 2 },
  { afterHours: 5 * 24, reminder: 3 },
] as const;

const RESUME_PATH: Record<OnboardingFlow, string> = {
  club: "/onboarding-club",
  people: "/onboarding-people",
};

export interface ReminderEmail {
  flow: OnboardingFlow;
  idempotencyKey: string;
  name: string;
  reminder: 1 | 2 | 3;
  resumeUrl: string;
  to: string;
}

export type SendReminderEmail = (email: ReminderEmail) => Promise<boolean>;

export interface SendDueRemindersOptions {
  db: Database;
  /** The current time. Passed in so tests control it. */
  now: Date;
  platformURL: string;
  send: SendReminderEmail;
}

/**
 * Sends the "finish your setup" emails that are due: 12 hours, 24 hours and
 * 5 days after the draft was last saved, then no more. A draft that is saved
 * again starts the count over, and a draft that is deleted (the wizard
 * finished) is never reminded about.
 *
 * Each reminder is claimed in the database before it is sent, so two runs
 * overlapping can never send the same one twice. If the send then fails the
 * reminder is released and tried again on the next run.
 *
 * @returns how many emails were sent
 */
export const sendDueOnboardingReminders = async ({
  db,
  now,
  platformURL,
  send,
}: SendDueRemindersOptions): Promise<number> => {
  const results = await Promise.all(
    REMINDER_SCHEDULE.map(async ({ afterHours, reminder }) => {
      const cutoff = new Date(now.getTime() - afterHours * MS_PER_HOUR);
      const due = await db
        .select({
          email: users.email,
          flow: onboardingDrafts.flow,
          id: onboardingDrafts.id,
          name: users.name,
        })
        .from(onboardingDrafts)
        .innerJoin(users, eq(users.id, onboardingDrafts.userId))
        .where(
          and(
            eq(onboardingDrafts.remindersSent, reminder - 1),
            lte(onboardingDrafts.updatedAt, cutoff)
          )
        );
      const sent = await Promise.all(
        due.map(async (draft) => {
          // Claim: only one run can move the count from reminder - 1 to reminder.
          const claimed = await db
            .update(onboardingDrafts)
            .set({ lastRemindedAt: now, remindersSent: reminder })
            .where(
              and(
                eq(onboardingDrafts.id, draft.id),
                eq(onboardingDrafts.remindersSent, reminder - 1)
              )
            )
            .returning({ id: onboardingDrafts.id });
          if (claimed.length === 0) {
            return false;
          }
          const ok = await send({
            flow: draft.flow,
            idempotencyKey: `onboarding-reminder-${draft.id}-${reminder}`,
            name: draft.name,
            reminder,
            resumeUrl: `${platformURL}${RESUME_PATH[draft.flow]}`,
            to: draft.email,
          });
          if (!ok) {
            await db
              .update(onboardingDrafts)
              .set({ remindersSent: reminder - 1 })
              .where(
                and(
                  eq(onboardingDrafts.id, draft.id),
                  eq(onboardingDrafts.remindersSent, reminder)
                )
              );
          }
          return ok;
        })
      );
      return sent.filter(Boolean).length;
    })
  );
  return results.reduce((total, count) => total + count, 0);
};
