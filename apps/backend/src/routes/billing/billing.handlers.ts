import { isBillingManager } from "@alice/authentication";
import { keys as authKeys } from "@alice/authentication/keys";
import { HTTPException } from "hono/http-exception";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { getClubBilling } from "@/services/club-billing";
import {
  ensureStripeCustomer,
  findCurrentSubscription,
  syncSubscription,
} from "@/services/club-subscriptions";
import { db } from "@/services/database";
import type { AuthedRouteHandler } from "@/types";

import type {
  CancelRoute,
  CheckoutRoute,
  PortalRoute,
  RestoreRoute,
  StatusRoute,
} from "./billing.route";

const BILLING_PAGE = "/settings/billing";

/** Only the club's owners and admins may manage what the club pays. */
const requireBillingManager = async (
  organizationId: string,
  userId: string
) => {
  if (!(await isBillingManager(db, { organizationId, userId }))) {
    throw new HTTPException(HttpStatusCodes.FORBIDDEN, {
      res: Response.json(
        { message: "Only a club owner or admin can manage billing" },
        { status: HttpStatusCodes.FORBIDDEN }
      ),
    });
  }
};

type CurrentSubscription = NonNullable<
  Awaited<ReturnType<typeof findCurrentSubscription>>
>;

const toBody = (subscription: CurrentSubscription) => ({
  billingInterval: subscription.billingInterval,
  cancelAt: subscription.cancelAt?.toISOString() ?? null,
  cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
  id: subscription.id,
  status: subscription.status,
});

const pageUrl = (query = "") =>
  `${authKeys().PLATFORM_URL}${BILLING_PAGE}${query}`;

export const status: AuthedRouteHandler<StatusRoute> = async (c) => {
  const organizationId = c.get("organizationId");
  await requireBillingManager(organizationId, c.get("userId"));
  const subscription = await findCurrentSubscription(organizationId);
  return c.json(
    { subscription: subscription === undefined ? null : toBody(subscription) },
    HttpStatusCodes.OK
  );
};

export const checkout: AuthedRouteHandler<CheckoutRoute> = async (c) => {
  const organizationId = c.get("organizationId");
  const userId = c.get("userId");
  await requireBillingManager(organizationId, userId);

  if ((await findCurrentSubscription(organizationId)) !== undefined) {
    return c.json(
      { message: "This club already has a subscription" },
      HttpStatusCodes.CONFLICT
    );
  }
  const user = await db.query.users.findFirst({ where: { id: userId } });
  if (user === undefined) {
    throw new HTTPException(HttpStatusCodes.UNAUTHORIZED);
  }
  const customerId = await ensureStripeCustomer({
    contactEmail: user.email,
    organizationId,
  });
  if (customerId === undefined) {
    throw new HTTPException(HttpStatusCodes.NOT_FOUND);
  }

  const { interval } = c.req.valid("json");
  const clientSecret = await getClubBilling().createCheckoutSession({
    customerId,
    interval,
    organizationId,
    // Stripe fills in the session id. The page only shows a message: access
    // follows the webhook, never this redirect.
    returnUrl: pageUrl("?checkout=complete&session_id={CHECKOUT_SESSION_ID}"),
  });
  return c.json({ clientSecret }, HttpStatusCodes.OK);
};

export const portal: AuthedRouteHandler<PortalRoute> = async (c) => {
  const organizationId = c.get("organizationId");
  await requireBillingManager(organizationId, c.get("userId"));

  const club = await db.query.organizations.findFirst({
    where: { id: organizationId },
  });
  if (club === undefined || club.stripeCustomerId === null) {
    return c.json(
      { message: "This club has not subscribed yet" },
      HttpStatusCodes.CONFLICT
    );
  }
  const url = await getClubBilling().createPortalSession({
    customerId: club.stripeCustomerId,
    returnUrl: pageUrl(),
  });
  return c.json({ url }, HttpStatusCodes.OK);
};

const changeCancellation = async (
  organizationId: string,
  cancel: boolean
): Promise<CurrentSubscription | undefined> => {
  const current = await findCurrentSubscription(organizationId);
  if (current === undefined) {
    return undefined;
  }
  await getClubBilling().setCancelAtPeriodEnd(
    current.stripeSubscriptionId,
    cancel
  );
  await syncSubscription(current.stripeSubscriptionId);
  return await findCurrentSubscription(organizationId);
};

export const cancel: AuthedRouteHandler<CancelRoute> = async (c) => {
  const organizationId = c.get("organizationId");
  await requireBillingManager(organizationId, c.get("userId"));
  const updated = await changeCancellation(organizationId, true);
  if (updated === undefined) {
    return c.json(
      { message: "This club has no subscription" },
      HttpStatusCodes.CONFLICT
    );
  }
  return c.json({ subscription: toBody(updated) }, HttpStatusCodes.OK);
};

export const restore: AuthedRouteHandler<RestoreRoute> = async (c) => {
  const organizationId = c.get("organizationId");
  await requireBillingManager(organizationId, c.get("userId"));
  const updated = await changeCancellation(organizationId, false);
  if (updated === undefined) {
    return c.json(
      { message: "This club has no subscription" },
      HttpStatusCodes.CONFLICT
    );
  }
  return c.json({ subscription: toBody(updated) }, HttpStatusCodes.OK);
};
