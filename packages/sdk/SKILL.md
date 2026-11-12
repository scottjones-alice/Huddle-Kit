---
name: huddlekit-api-typescript-sdk
description: "TypeScript SDK for Huddlekit API. Use when writing TypeScript code that calls Huddlekit API with the @alicesystems-co/huddlekit package: installing it, constructing and authenticating the client, and calling API operations."
---

# Huddlekit API TypeScript SDK

Generated TypeScript client for Huddlekit API, published as `@alicesystems-co/huddlekit`. Use the generated client instead of hand-writing HTTP requests.

## Install

```sh
npm install @alicesystems-co/huddlekit
```

## Client setup and authentication

```ts
import HuddlekitAPI from '@alicesystems-co/huddlekit';

const client = new HuddlekitAPI({
  sessionCookie: process.env['SESSION_COOKIE'], // defaults to the SESSION_COOKIE env var
});
```

Provide credentials using the options below. Environment variables are read automatically when the target runtime supports them:

- `sessionCookie` (env: `SESSION_COOKIE`) — Better Auth session cookie, set when signing in.

## Calling operations

```ts
import HuddlekitAPI from '@alicesystems-co/huddlekit';

const client = new HuddlekitAPI({
  sessionCookie: process.env['SESSION_COOKIE'], // defaults to the SESSION_COOKIE env var
});

const health = await client.health.listAPIRoot();

console.log(health);
```

Method names, parameter shapes, and response types are generated from the API description — do not guess them. Look up the exact call signature in [api.md](./api.md) before writing a call.

## Error handling

Non-success responses throw generated API errors. Error objects expose status, headers, response body, and request metadata where the target runtime supports it.

```ts
import { APIError } from '@alicesystems-co/huddlekit';

try {
  const health = await client.health.listAPIRoot();
} catch (err) {
  if (err instanceof APIError) {
    console.log(err.status, err.name, err.headers);
  }
  throw err;
}
```

## Requirements

- Node.js 20+, a modern browser, or any runtime with `fetch` support

## Reference files

- [README.md](./README.md) — full feature tour: client options, request options, retries and timeouts, logging.
- [api.md](./api.md) — complete catalogue of every operation with request and response types.
