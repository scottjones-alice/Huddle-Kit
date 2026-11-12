import { OpenAPIHono } from "@hono/zod-openapi";
import type { Schema } from "hono";
import { requestId } from "hono/request-id";
import { notFound, serveEmojiFavicon } from "stoker/middlewares";
import { defaultHook } from "stoker/openapi";

import { onError } from "@/lib/on-error";
import { cors } from "@/middlewares/cors";
import { pinoLogger } from "@/middlewares/pino-logger";
import type { AppBindings, AppOpenAPI, AuthedBindings } from "@/types";

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    defaultHook,
    strict: false,
  });
}

/** A router whose handlers can read `userId` and `organizationId` (see requireSession). */
export function createAuthedRouter() {
  return new OpenAPIHono<AuthedBindings>({
    defaultHook,
    strict: false,
  });
}

export default function createApp() {
  const app = createRouter();
  app
    .use(cors())
    .use(requestId())
    .use(serveEmojiFavicon("📝"))
    .use(pinoLogger());

  app.notFound(notFound);
  app.onError(onError);
  return app;
}

export function createTestApp<S extends Schema>(router: AppOpenAPI<S>) {
  return createApp().route("/", router);
}
