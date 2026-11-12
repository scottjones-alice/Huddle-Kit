/** Public entry point for @alice/notifications. */

export { createNotifications, createNovuClient } from "./create-notifications";

export type {
  CreateNovuClientOptions,
  Notifications,
  NovuLike,
  SendNotificationInput,
  SubscriberInput,
} from "./create-notifications";

export { NotificationError } from "./errors";

export type { NotificationErrorCode } from "./errors";

export { workflowIds } from "./workflows";

export type { NotificationPayloadMap, NotificationWorkflow } from "./workflows";
