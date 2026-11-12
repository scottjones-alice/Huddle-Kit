import { createNotifications } from "@alice/notifications";

import { logger } from "@/services/logger";

export const notifications = createNotifications();

export interface NotifyWelcomeInput {
  email: string;
  getStartedUrl: string;
  name: string;
  userId: string;
}

/**
 * Registers the user with Novu and sends the in-app and push welcome.
 * Never throws: a Novu outage must not break sign-up, so failures are logged.
 * The email goes through Resend (see auth.ts), so build the Novu "welcome"
 * workflow with In-App and Push steps only, or the user gets two emails.
 */
export const notifyWelcome = async ({
  email,
  getStartedUrl,
  name,
  userId,
}: NotifyWelcomeInput): Promise<void> => {
  try {
    await notifications.upsertSubscriber({
      email,
      firstName: name,
      subscriberId: userId,
    });
    await notifications.send({
      payload: { getStartedUrl, name },
      to: userId,
      transactionId: `welcome-${userId}`,
      workflow: "welcome",
    });
  } catch (error) {
    logger.error({ err: error, userId }, "Could not send welcome notification");
  }
};
