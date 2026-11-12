import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { IdUUIDParamsSchema } from "stoker/openapi/schemas";

const TAGS = ["Payments"];

const errorSchema = z.object({
  code: z.string().optional(),
  message: z.string(),
});

const unauthorized = jsonContent(errorSchema, "No signed-in user.");
const forbidden = jsonContent(
  errorSchema,
  "No active organization, or the caller is not an owner or admin of the club."
);
const notConfigured = jsonContent(
  errorSchema,
  "Card payments are not set up on this server."
);

export const account = createRoute({
  description:
    "Whether the club can take card payments from its members. Reads the live status from Stripe.",
  method: "get",
  operationId: "getConnectAccount",
  path: "/payments/connect/account",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        status: z.enum([
          "not_connected",
          "pending",
          "active",
          "restricted",
          "unsupported",
        ]),
      }),
      "The club's card payment status."
    ),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.FORBIDDEN]: forbidden,
    [HttpStatusCodes.SERVICE_UNAVAILABLE]: notConfigured,
  },
  summary: "Card payment status",
  tags: TAGS,
});

export const onboarding = createRoute({
  description:
    "Creates the club's Stripe account the first time, then returns a single-use Stripe-hosted onboarding link. Call again for a fresh link.",
  method: "post",
  operationId: "startConnectOnboarding",
  path: "/payments/connect/onboarding",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ url: z.url() }),
      "Where to send the user to set up card payments."
    ),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.FORBIDDEN]: forbidden,
    [HttpStatusCodes.SERVICE_UNAVAILABLE]: notConfigured,
  },
  summary: "Start card payment onboarding",
  tags: TAGS,
});

export const checkout = createRoute({
  description:
    "Returns a Stripe Checkout page for the amount still owed on a fee charge. The money goes to the club's own Stripe account.",
  method: "post",
  operationId: "createChargeCheckout",
  path: "/payments/connect/charges/{id}/checkout",
  request: { params: IdUUIDParamsSchema },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ url: z.url() }),
      "Where to send the payer."
    ),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.FORBIDDEN]: forbidden,
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      errorSchema,
      "No such charge, or it belongs to another club."
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      errorSchema,
      "The charge is not due, nothing is owed, or the club cannot take cards yet."
    ),
    [HttpStatusCodes.SERVICE_UNAVAILABLE]: notConfigured,
  },
  summary: "Pay a fee charge by card",
  tags: TAGS,
});

export type AccountRoute = typeof account;
export type OnboardingRoute = typeof onboarding;
export type CheckoutRoute = typeof checkout;
