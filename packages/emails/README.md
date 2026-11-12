# @alice/emails

[React Email](https://react.email) templates that render to HTML, plain text and a subject line. The output is provider-agnostic: hand it to Resend, Novu or anything else.

## Usage

```ts
import { renderEmail, transactionalHeaders } from "@alice/emails";

const { html, text, subject } = await renderEmail("welcome", {
  getStartedUrl: "https://huddlekit.com/dashboard",
  name: "Alex",
});

// e.g. with Resend
await resend.emails.send({
  from,
  headers: transactionalHeaders({ entityRefId: user.id }),
  html,
  subject,
  text,
  to,
});
```

Template names and their props are fully typed.

## Custom emails

Override the subject for a single send:

```ts
await renderEmail("welcome", props, { subject: "Custom subject" });
```

Render a one-off email built from the shared components, without registering a template:

```tsx
import { renderElement } from "@alice/emails";
import { Button } from "@alice/emails/components/button";
import { EmailLayout } from "@alice/emails/components/email-layout";

const { html, text } = await renderElement(
  <EmailLayout preview="Hello">
    <Button href={url}>Go</Button>
  </EmailLayout>
);
```

## Templates

| Name | Props |
| --- | --- |
| `welcome` | `name`, `getStartedUrl` |
| `verify-email` | `name`, `verificationUrl`, `expiresInMinutes?` (60) |
| `forgot-password` | `name`, `resetUrl`, `expiresInMinutes?` (30) |
| `password-reset` | `name`, `signInUrl` |
| `accept-invite` | `inviterName`, `teamName`, `inviteUrl`, `expiresInDays?` (7) |

## Structure

- `src/components/` — reusable building blocks: `email-layout`, `header`, `footer`, `title`, `paragraph`, `button`, `link-fallback`, `divider`.
- `src/templates/` — one file per email. Each exports its props type, the component, and `PreviewProps` for the preview server.
- `src/lib/` — `brand` (name, support email), `theme` (colors, fonts, spacing), `headers` (transactional headers), `registry` (name → component + subject) and `render`.

## Adding a template

1. Create `src/templates/my-email.tsx` using `EmailLayout` and the shared components, with `PreviewProps`.
2. Add its props to `EmailPropsMap` and an entry (component + subject) to `emailTemplates` in `src/lib/registry.ts`.
3. Add a test in `test/`.

## Scripts

- `pnpm dev` — live preview of every template at http://localhost:3003
- `pnpm export` — export static HTML for each template
- `pnpm check-types` — type-check
- `pnpm test` — run tests with Vitest
