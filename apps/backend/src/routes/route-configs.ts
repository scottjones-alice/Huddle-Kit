import type { RouteConfig } from "@hono/zod-openapi";

import * as club from "./club/club.route";
import * as events from "./events/events.route";
import * as files from "./files/files.route";
import * as onboarding from "./onboarding/onboarding.route";
import * as opponents from "./opponents/opponents.route";
import * as payments from "./payments/payments.route";
import * as people from "./people/people.route";
import * as roles from "./roles/roles.route";
import { rootRoute } from "./root/root.route";
import * as teams from "./teams/teams.route";
import * as venues from "./venues/venues.route";

/**
 * Every route definition in the API, in one list. The tests that check the
 * generated API document (operation ids, tags, examples) read this, so a new
 * route file only has to be added here to be checked.
 */
const modules: Record<string, unknown>[] = [
  club,
  events,
  files,
  onboarding,
  opponents,
  payments,
  people,
  roles,
  teams,
  venues,
  { rootRoute },
];

const isRouteConfig = (value: unknown): value is RouteConfig =>
  typeof value === "object" &&
  value !== null &&
  "method" in value &&
  "path" in value;

export const allRouteConfigs: RouteConfig[] = modules.flatMap((module) =>
  Object.values(module).filter((value) => isRouteConfig(value))
);
