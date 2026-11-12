/**
 * Workflow registry: the Novu workflow identifiers this app triggers and the
 * payload each one expects. Build the workflows in the Novu dashboard with
 * these identifiers and reference the payload fields in the step templates
 * as `{{payload.name}}`.
 *
 * To add a workflow: add its payload to `NotificationPayloadMap` and its
 * identifier to `workflowIds`.
 */

export interface NotificationPayloadMap {
  /** In-app inbox, push and email sent when a user is invited to a team. */
  "team-invite": {
    inviteUrl: string;
    inviterName: string;
    teamName: string;
  };
  /** In-app inbox, push and email sent after sign-up. */
  welcome: {
    getStartedUrl: string;
    name: string;
  };
}

export type NotificationWorkflow = keyof NotificationPayloadMap;

/** Novu workflow identifier for each workflow. Must match the dashboard. */
export const workflowIds = {
  "team-invite": "team-invite",
  welcome: "welcome",
} as const satisfies Record<NotificationWorkflow, string>;
