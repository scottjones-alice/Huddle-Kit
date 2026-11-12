# @alice/user-interface

User interface for website and platform

## Usage

```ts
import { name } from "@alice/user-interface";
```

## Scripts

- `pnpm check-types` — type-check
- `pnpm test` — run tests with Vitest

## Football loading states

`FootballMatch` is a reusable vector illustration of a five-a-side match. It runs entirely in CSS, needs no downloaded assets, and becomes a still illustration when the user prefers reduced motion. Pass `paused` to stop it manually.

```tsx
import {
  FootballLoader,
  FootballLoadingBoundary,
} from "@alice/user-interface/components/football-loader";
import { FootballMatch } from "@alice/user-interface/components/football-match";

// Page / route fallback. Use variant="splash" for the dark, branded full screen.
<FootballLoader label="Getting the team ready" />;

// Supply progress from the real upload callback. Omit it when unknown.
// Keep state="loading" while confirming the uploaded file with the backend,
// even if the byte transfer has reached 100%.
<FootballLoader
  variant="inline"
  label="Uploading team-photo.jpg"
  description="Keep this page open while we add your photo."
  progress={uploadProgress}
  state={uploadState}
/>;

// The parent sets its size; ready content fades in immediately on completion.
<FootballLoadingBoundary loading={isPending} className="min-h-[32rem]">
  <TeamDashboard />
</FootballLoadingBoundary>;
```

States are `loading`, `success`, and `error`. Success shows the goal celebration; errors stop play and display an error message. Include retry/cancel actions in the caller, where the operation is owned. Animation timing never estimates progress. The boundary keeps children mounted, inert and hidden from assistive technology until ready, then fades out the loader in 220 ms without delaying the operation. Override `--football-loader-min-height` when placing a loader in a sized container.

Try the interactive web demo at `/loading-preview` in the platform app. Upload controls there are a simulation and do not send files. The native app has matching components and its own preview route; see `apps/native/README.md`.
