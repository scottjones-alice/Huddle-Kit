import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

const TAGS = ["Billing"];

const errorSchema = z.object({
  code: z.string().optional(),
  message: z.string(),
});

const unauthorized = jsonContent(errorSchema, "No signed-in user.");
const forbidden = jsonContent(
  errorSchema,
  "No active organization, or the caller is not an owner or admin of the club."
);

const subscriptionSchema = z.object({
  billingInterval: z.enum(["monthly", "yearly"]),
  cancelAt: z.iso.datetime().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  currentPeriodEnd: z.iso.datetime().nullable(),
  id: z.uuid(),
  status: z.enum([
    "active",
    "canceled",
    "incomplete",
    "incomplete_expired",
    "past_due",
    "paused",
    "trialing",
    "unpaid",
  ]),
});

export const status = createRoute({
  description:
    "The club's Huddlekit subscription, or null if it has never subscribed or the last one ended. Owners and admins only.",
  method: "get",
  operationId: "getBilling",
  path: "/billing",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ subscription: subscriptionSchema.nullable() }),
      "The club's current subscription."
    ),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.FORBIDDEN]: forbidden,
  },
  summary: "Club subscription status",
  tags: TAGS,
});

export const checkout = createRoute({
  description:
    "Starts an embedded Stripe Checkout for the club plan and returns the client secret to hand to Stripe.js. Nothing is granted until Stripe confirms payment by webhook.",
  method: "post",
  operationId: "createBillingCheckout",
  path: "/billing/checkout",
  request: {
    body: jsonContentRequired(
      z.object({ interval: z.enum(["monthly", "yearly"]) }),
      "Which billing period the club chose."
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ clientSecret: z.string().min(1) }),
      "The Checkout Session's client secret."
    ),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.FORBIDDEN]: forbidden,
    [HttpStatusCodes.CONFLICT]: jsonContent(
      errorSchema,
      "The club already has a subscription. Manage it instead."
    ),
  },
  summary: "Start subscription checkout",
  tags: TAGS,
});

export const portal = createRoute({
  description:
    "Returns a link to Stripe's billing portal, where the club updates its card and reads invoices.",
  method: "post",
  operationId: "createBillingPortal",
  path: "/billing/portal",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ url: z.url() }),
      "Where to send the user."
    ),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.FORBIDDEN]: forbidden,
    [HttpStatusCodes.CONFLICT]: jsonContent(
      errorSchema,
      "The club has no Stripe account to manage yet."
    ),
  },
  summary: "Open the billing portal",
  tags: TAGS,
});

const subscriptionChange = (
  operationId: string,
  path: string,
  summary: string,
  description: string
) =>
  createRoute({
    description,
    method: "post",
    operationId,
    path,
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({ subscription: subscriptionSchema }),
        "The subscription after the change."
      ),
      [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
      [HttpStatusCodes.FORBIDDEN]: forbidden,
      [HttpStatusCodes.CONFLICT]: jsonContent(
        errorSchema,
        "The club has no subscription to change."
      ),
    },
    summary,
    tags: TAGS,
  });

export const cancel = subscriptionChange(
  "cancelBilling",
  "/billing/cancel",
  "Cancel at period end",
  "Ends the subscription when the period already paid for runs out. The club keeps access until then."
);

export const restore = subscriptionChange(
  "restoreBilling",
  "/billing/restore",
  "Undo a scheduled cancellation",
  "Keeps the subscription going after a cancellation was scheduled but has not happened yet."
);

export type StatusRoute = typeof status;
export type CheckoutRoute = typeof checkout;
export type PortalRoute = typeof portal;
export type CancelRoute = typeof cancel;
export type RestoreRoute = typeof restore;
