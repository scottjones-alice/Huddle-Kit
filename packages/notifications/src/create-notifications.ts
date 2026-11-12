import { Novu } from "@novu/api";

import { NotificationError } from "./errors";
import { keys } from "./keys";
import { workflowIds } from "./workflows";
import type { NotificationPayloadMap, NotificationWorkflow } from "./workflows";

export interface CreateNovuClientOptions {
  /** Override for the EU region or a self-hosted Novu. */
  serverURL?: string;
}

/**
 * Builds the Novu SDK client from the environment.
 *
 * @returns A Novu client authenticated with `NOVU_SECRET_KEY`.
 */
export const createNovuClient = (
  options: CreateNovuClientOptions = {}
): Novu => {
  const env = keys();
  return new Novu({
    // Retries 408, 429 and 5xx and dropped connections with growing waits. Safe
    // because send() passes a transactionId, which Novu uses to ignore repeats.
    retryConfig: {
      backoff: {
        exponent: 1.5,
        initialInterval: 500,
        maxElapsedTime: 10_000,
        maxInterval: 3000,
      },
      retryConnectionErrors: true,
      strategy: "backoff",
    },
    secretKey: env.NOVU_SECRET_KEY,
    serverURL: options.serverURL ?? env.NOVU_API_URL,
    timeoutMs: 8000,
  });
};

export interface SubscriberInput {
  avatar?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  locale?: string;
  /** Your user id. Novu uses it to address every channel for that user. */
  subscriberId: string;
}

export interface SendNotificationInput<W extends NotificationWorkflow> {
  /** Subscriber id of whoever caused the notification, shown as the avatar. */
  actorId?: string;
  payload: NotificationPayloadMap[W];
  /** One or many subscriber ids (Novu allows up to 100 per call). */
  to: string | string[];
  /** Repeating the same id is ignored by Novu, so retries cannot double-send. */
  transactionId?: string;
  workflow: W;
}

/** The slice of the Novu SDK this package uses, so tests can fake it. */
export interface NovuLike {
  cancel: (transactionId: string) => Promise<unknown>;
  subscribers: {
    create: (input: SubscriberInput) => Promise<unknown>;
    delete: (subscriberId: string) => Promise<unknown>;
  };
  trigger: (request: {
    actor?: string;
    payload: Record<string, unknown>;
    to: string | string[];
    transactionId?: string;
    workflowId: string;
  }) => Promise<{
    result: { acknowledged: boolean; status: string; transactionId?: string };
  }>;
}

export interface Notifications {
  /** Cancels delayed or digested runs for a transaction. */
  cancel: (transactionId: string) => Promise<void>;
  /** Removes a subscriber and their inbox when a user is deleted. */
  deleteSubscriber: (subscriberId: string) => Promise<void>;
  /** Triggers a workflow for one or more subscribers. */
  send: <W extends NotificationWorkflow>(
    input: SendNotificationInput<W>
  ) => Promise<{ transactionId: string }>;
  /** Creates the subscriber, or updates it if it already exists. */
  upsertSubscriber: (input: SubscriberInput) => Promise<void>;
}

/**
 * Typed wrapper over the Novu SDK. Pass your own client in tests.
 *
 * @returns The notification functions the apps use.
 */
export const createNotifications = (
  novu: NovuLike = createNovuClient()
): Notifications => ({
  cancel: async (transactionId) => {
    try {
      await novu.cancel(transactionId);
    } catch (error) {
      throw new NotificationError(
        "trigger_failed",
        `Could not cancel notification ${transactionId}.`,
        error
      );
    }
  },

  deleteSubscriber: async (subscriberId) => {
    try {
      await novu.subscribers.delete(subscriberId);
    } catch (error) {
      throw new NotificationError(
        "subscriber_failed",
        `Could not delete subscriber ${subscriberId}.`,
        error
      );
    }
  },

  send: async ({ actorId, payload, to, transactionId, workflow }) => {
    try {
      const { result } = await novu.trigger({
        actor: actorId,
        payload,
        to,
        transactionId,
        workflowId: workflowIds[workflow],
      });
      if (!result.acknowledged || result.status !== "processed") {
        throw new NotificationError(
          "trigger_rejected",
          `Novu did not process "${workflow}": ${result.status}.`
        );
      }
      return { transactionId: result.transactionId ?? transactionId ?? "" };
    } catch (error) {
      if (error instanceof NotificationError) {
        throw error;
      }
      throw new NotificationError(
        "trigger_failed",
        `Could not trigger "${workflow}".`,
        error
      );
    }
  },

  upsertSubscriber: async (input) => {
    try {
      await novu.subscribers.create(input);
    } catch (error) {
      throw new NotificationError(
        "subscriber_failed",
        `Could not save subscriber ${input.subscriberId}.`,
        error
      );
    }
  },
});
