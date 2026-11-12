import { keys } from "@/keys";
import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import {
  closeWhenShuttingDown,
  compressResponses,
  limitBody,
  limitDuration,
  logSlowRequests,
  noStore,
  securityHeaders,
} from "@/middlewares/protect";
import { rateLimit } from "@/middlewares/rate-limit";
import club from "@/routes/club/club.index";
import files from "@/routes/files/files.index";
import internal from "@/routes/internal/internal.index";
import onboarding from "@/routes/onboarding/onboarding.index";
import opponents from "@/routes/opponents/opponents.index";
import payments from "@/routes/payments/payments.index";
import people from "@/routes/people/people.index";
import roles from "@/routes/roles/roles.index";
import root from "@/routes/root/root.index";
import teams from "@/routes/teams/teams.index";
import venues from "@/routes/venues/venues.index";
import connectWebhook from "@/routes/webhooks/connect-webhook";
import { auth } from "@/services/auth";

const API_PREFIX = "/api/v1";
const MS_PER_SECOND = 1000;

/**
 * Never rate limited: the health check, so a busy client can't make the API
 * look down, and Stripe webhooks, which arrive in bursts, are signed, and are
 * retried by Stripe if refused.
 */
const EXEMPT_PREFIXES = [
  "/api/auth/stripe/webhook",
  "/api/v1/webhooks/",
] as const;
const isRateLimitExempt = (path: string): boolean =>
  path.replace(/\/$/u, "") === API_PREFIX ||
  EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix));

const {
  MAX_BODY_BYTES,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_SECONDS,
  REQUEST_TIMEOUT_MS,
  SLOW_REQUEST_MS,
  TRUST_PROXY,
} = keys();

const app = createApp();

// Everything under /api is protected the same way. The health check is exempt
// from the rate limit so a busy client can never make the API look down.
app.use(
  "/api/*",
  compressResponses(),
  securityHeaders(),
  noStore(),
  closeWhenShuttingDown(),
  logSlowRequests(SLOW_REQUEST_MS),
  limitBody(MAX_BODY_BYTES),
  limitDuration(REQUEST_TIMEOUT_MS),
  rateLimit({
    max: RATE_LIMIT_MAX,
    skip: (c) => isRateLimitExempt(c.req.path),
    trustProxy: TRUST_PROXY,
    windowMs: RATE_LIMIT_WINDOW_SECONDS * MS_PER_SECOND,
  })
);

configureOpenAPI(app, API_PREFIX);

// Auth stays outside the versioned prefix. Better Auth's default base path is /api/auth.
app.on(
  ["GET", "POST"],
  "/api/auth/*",
  async (c) => await auth.handler(c.req.raw)
);

const routes = [
  root,
  club,
  files,
  onboarding,
  opponents,
  payments,
  people,
  roles,
  teams,
  venues,
] as const;

// Mounted one by one: the routers have different bindings, so they can't share a loop.
app.route(API_PREFIX, root);
app.route(API_PREFIX, club);
app.route(API_PREFIX, files);
app.route(API_PREFIX, onboarding);
app.route(API_PREFIX, opponents);
app.route(API_PREFIX, payments);
app.route(API_PREFIX, people);
app.route(API_PREFIX, roles);
app.route(API_PREFIX, teams);
app.route(API_PREFIX, venues);
app.route(API_PREFIX, connectWebhook);
app.route(API_PREFIX, internal);

export type AppType = (typeof routes)[number];

export default app;
