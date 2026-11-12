# @alice/notifications

In-app inbox, email and push notifications through [Novu](https://novu.co). A typed wrapper over `@novu/api`: workflows are built in the Novu dashboard, and this package fixes their identifiers and payloads.

## Setup

Set these on the server that sends notifications:

| Variable | Required | Notes |
| --- | --- | --- |
| `NOVU_SECRET_KEY` | yes | Dashboard → API keys. |
| `NOVU_API_URL` | no | `https://eu.api.novu.co` for the EU region, or your self-hosted URL. |

In the Novu dashboard, create one workflow per entry in `src/workflows.ts` with the same identifier (`welcome`, `team-invite`), then add the steps. `welcome` has In-App and Push only, because Resend already sends the welcome email. Reference fields as `{{payload.name}}`. Connect an email provider (e.g. Resend) and a push provider (e.g. Expo) under Integrations.

## Usage

```ts
import { createNotifications } from "@alice/notifications";

const notifications = createNotifications();

// When a user signs up
await notifications.upsertSubscriber({
  email: user.email,
  firstName: user.name,
  subscriberId: user.id,
});

await notifications.send({
  payload: { getStartedUrl, name: user.name },
  to: user.id,
  transactionId: `welcome-${user.id}`,
  workflow: "welcome",
});
```

Workflow names and payloads are fully typed. Failures throw a `NotificationError` with a `code`.

To add a workflow, add its payload to `NotificationPayloadMap` and its identifier to `workflowIds`.

## Scripts

- `pnpm check-types` — type-check
- `pnpm test` — run tests with Vitest
