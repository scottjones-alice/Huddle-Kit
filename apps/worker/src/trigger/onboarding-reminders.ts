import { logger, schedules } from "@trigger.dev/sdk";

import { keys } from "../keys";

const HTTP_OK = 200;

/**
 * Every hour, asks the backend to send the "finish your setup" emails that
 * are due (12 hours, 24 hours and 5 days after a saved draft). The backend
 * decides who is due, so the schedule can run as often as you like.
 */
export const onboardingRemindersTask = schedules.task({
  cron: "0 * * * *",
  id: "onboarding-reminders",
  run: async () => {
    const { BACKEND_URL, CRON_SECRET } = keys();
    const response = await fetch(
      `${BACKEND_URL}/api/v1/internal/onboarding-reminders`,
      {
        headers: { "x-cron-secret": CRON_SECRET },
        method: "POST",
        signal: AbortSignal.timeout(60_000),
      }
    );
    if (response.status !== HTTP_OK) {
      throw new Error(`Backend answered ${response.status}`);
    }
    const body: unknown = await response.json();
    logger.info("Onboarding reminders sent", { body });
    return body;
  },
});
