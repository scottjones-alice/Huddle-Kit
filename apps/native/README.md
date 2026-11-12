# Huddlekit mobile

## Football loading illustrations

Start with `pnpm --filter @huddlekit/native dev` and choose **Preview loading animations** on the home screen, or open `/loading-preview`. The preview includes the page loader, file progress controls, and a mobile splash transition. Progress buttons are demonstrations; they do not upload files.

`src/components/football-loader.tsx` renders a tiny match with lime and coral teams, passes, a shot, and a goal. It uses the existing React Native `Animated` API with the native driver, pauses in the background, and respects the device's Reduce Motion preference. No image downloads or extra animation libraries are required.

```tsx
import { FootballLoader } from "@/components/football-loader";

<FootballLoader label="Loading your club" description="Getting everyone together." />
<FootballLoader variant="splash" label="Getting the team ready" />
<FootballLoader
  variant="inline"
  label="Sending your file"
  progress={bytesSent / totalBytes * 100}
/>
<FootballLoader variant="inline" state="success" label="File ready" progress={100} />
<FootballLoader variant="inline" state="error" label="Upload interrupted" />
```

Variants are `page`, `splash`, and `inline`. `paused` stops motion. Omit `progress` when the actual amount completed is unknown. Progress is clamped to 0–100; non-finite values are treated as unknown. A goal in the loop is decorative and never signals that an operation completed. Set `state="success"` only after the operation actually succeeds; the caller owns retry and cancellation actions.

`FootballSplash` mounts children immediately beneath an accessible loading overlay and fades it away when `ready` becomes true. It is a one-time startup boundary; remount it with a new key to replay a demonstration. In the current scaffold, `_layout.tsx` marks content ready at its first layout. There is no artificial loading delay. When adding session restoration, fonts, or initial data, combine their real readiness with `contentReady`:

```tsx
<FootballSplash ready={contentReady && fontsLoaded && sessionRestored}>
  <AppContent />
</FootballSplash>
```

The OS launch splash shows a static kickoff illustration before JavaScript starts; its background matches the animated scene. The source illustration is `assets/images/football-splash.svg`, with its 3× PNG used by the Expo splash plugin. The mini match is the in-app loading layer after that native splash. Native splash config changes require a new development/production build and cannot be fully checked in Expo Go. See [Expo's splash documentation](https://docs.expo.dev/versions/latest/sdk/splash-screen/).

## Expo setup

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
