import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";
import type { Schema } from "hono";
import type { PinoLogger } from "hono-pino";

export interface AppBindings {
  Variables: {
    logger: PinoLogger;
  };
}

/** Bindings for routes behind the session middleware: the caller is known. */
export interface AuthedBindings {
  Variables: AppBindings["Variables"] & {
    organizationId: string;
    userId: string;
  };
}

// eslint-disable-next-line ts/no-empty-object-type typescript/ban-types
export type AppOpenAPI<S extends Schema = {}> = OpenAPIHono<AppBindings, S>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
  R,
  AppBindings
>;

export type AuthedRouteHandler<R extends RouteConfig> = RouteHandler<
  R,
  AuthedBindings
>;
