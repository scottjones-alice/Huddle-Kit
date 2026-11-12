import { timingSafeEqual } from "node:crypto";

import { keys as authKeys } from "@alice/authentication/keys";

import { keys } from "@/keys";
import { createRouter } from "@/lib/create-app";
import { db } from "@/services/database";
import { sendDueOnboardingReminders } from "@/services/onboarding-reminders";
import { sendEmail } from "@/services/resend";

const { CRON_SECRET } = keys();
const { PLATFORM_URL } = authKeys();

const matchesSecret = (given: string | undefined): boolean => {
  if (given === undefined) {
    return false;
  }
  const expected = Buffer.from(CRON_SECRET);
  const actual = Buffer.from(given);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

/**
 * Endpoints for scheduled jobs (the Trigger.dev worker). They are not for
 * browsers: every call must carry the shared secret in `x-cron-secret`.
 */
const router = createRouter();

router.post("/internal/onboarding-reminders", async (c) => {
  if (!matchesSecret(c.req.header("x-cron-secret"))) {
    return c.json({ message: "Not allowed" }, 401);
  }
  const sent = await sendDueOnboardingReminders({
    db,
    now: new Date(),
    platformURL: PLATFORM_URL,
    send: async ({ flow, idempotencyKey, name, reminder, resumeUrl, to }) => {
      const result = await sendEmail({
        idempotencyKey,
        props: { flow, name, reminder, resumeUrl },
        template: "finish-onboarding",
        to,
      });
      return result.ok;
    },
  });
  return c.json({ sent }, 200);
});

export default router;
