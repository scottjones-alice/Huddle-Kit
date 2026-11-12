import { isBillingManager } from "@alice/authentication";
import { clubStripeAccounts, completeOnboardingStep } from "@alice/database";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { keys } from "@/keys";
import { getConnect } from "@/services/connect";
import { db } from "@/services/database";
import { amountOwedMinor, findClubAccount } from "@/services/member-payments";
import type { AuthedRouteHandler } from "@/types";

import type {
  AccountRoute,
  CheckoutRoute,
  OnboardingRoute,
} from "./payments.route";

// Clubs are UK football clubs; Stripe asks for the country and currency once, at creation.
const CLUB_COUNTRY = "GB";
const CLUB_CURRENCY = "GBP";
const PAYMENTS_PAGE = "/settings/payments";

/** The web app's address: the first allowed browser origin. */
const webAppUrl = () => {
  const [origin] = keys().CORS_ORIGINS;
  return origin ?? "http://localhost:3000";
};

/**
 * Taking a club's card payments is a billing decision, so only the club's
 * owners and admins may do it, the same rule as the Huddlekit subscription.
 */
const requireBillingManager = async (
  organizationId: string,
  userId: string
) => {
  if (!(await isBillingManager(db, { organizationId, userId }))) {
    throw new HTTPException(HttpStatusCodes.FORBIDDEN, {
      res: Response.json(
        { message: "Only a club owner or admin can manage card payments" },
        { status: HttpStatusCodes.FORBIDDEN }
      ),
    });
  }
};

export const account: AuthedRouteHandler<AccountRoute> = async (c) => {
  const organizationId = c.get("organizationId");
  await requireBillingManager(organizationId, c.get("userId"));

  const existing = await findClubAccount(organizationId);
  if (existing === undefined) {
    return c.json({ status: "not_connected" as const }, HttpStatusCodes.OK);
  }

  const status = await getConnect().getCardPaymentsStatus(
    existing.stripeAccountId
  );
  if (status !== existing.cardPaymentsStatus) {
    await db
      .update(clubStripeAccounts)
      .set({ cardPaymentsStatus: status })
      .where(eq(clubStripeAccounts.organizationId, organizationId));
  }
  if (status === "active") {
    await completeOnboardingStep(
      db,
      { organizationId },
      "payouts",
      c.get("userId")
    );
  }
  return c.json({ status }, HttpStatusCodes.OK);
};

export const onboarding: AuthedRouteHandler<OnboardingRoute> = async (c) => {
  const organizationId = c.get("organizationId");
  const userId = c.get("userId");
  await requireBillingManager(organizationId, userId);
  const connect = getConnect();

  let existing = await findClubAccount(organizationId);
  if (existing === undefined) {
    const [organization, user] = await Promise.all([
      db.query.organizations.findFirst({ where: { id: organizationId } }),
      db.query.users.findFirst({ where: { id: userId } }),
    ]);
    if (organization === undefined || user === undefined) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND);
    }
    // Keyed on the club, so two clicks create one Stripe account.
    const stripeAccountId = await connect.createClubAccount({
      clubName: organization.name,
      contactEmail: user.email,
      country: CLUB_COUNTRY,
      currency: CLUB_CURRENCY,
      organizationId,
    });
    await db
      .insert(clubStripeAccounts)
      .values({ organizationId, stripeAccountId })
      .onConflictDoNothing();
    existing = await findClubAccount(organizationId);
  }
  if (existing === undefined) {
    throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  const base = `${webAppUrl()}${PAYMENTS_PAGE}`;
  const url = await connect.createOnboardingLink({
    accountId: existing.stripeAccountId,
    refreshUrl: `${base}?stripe=refresh`,
    returnUrl: `${base}?stripe=return`,
  });
  return c.json({ url }, HttpStatusCodes.OK);
};

export const checkout: AuthedRouteHandler<CheckoutRoute> = async (c) => {
  const organizationId = c.get("organizationId");
  await requireBillingManager(organizationId, c.get("userId"));
  const { id } = c.req.valid("param");

  // Same 404 for a charge in another club as for one that does not exist.
  const charge = await db.query.feeCharges.findFirst({
    where: { id, organizationId },
    with: { fee: true },
  });
  if (charge === undefined) {
    return c.json({ message: "Not Found" }, HttpStatusCodes.NOT_FOUND);
  }
  if (charge.status !== "due") {
    return c.json(
      { message: "This charge is not due" },
      HttpStatusCodes.CONFLICT
    );
  }
  const owedMinor = await amountOwedMinor(charge.id, charge.amountMinor);
  if (owedMinor <= 0) {
    return c.json({ message: "Nothing is owed" }, HttpStatusCodes.CONFLICT);
  }
  const club = await findClubAccount(organizationId);
  if (club === undefined) {
    return c.json(
      { message: "This club has not set up card payments" },
      HttpStatusCodes.CONFLICT
    );
  }

  const base = `${webAppUrl()}${PAYMENTS_PAGE}`;
  try {
    const url = await getConnect().createMemberCheckout({
      accountId: club.stripeAccountId,
      amountMinor: owedMinor,
      cancelUrl: `${base}?payment=cancelled`,
      chargeId: charge.id,
      currency: charge.currency,
      description: charge.fee?.name ?? "Club fee",
      successUrl: `${base}?payment=success`,
    });
    return c.json({ url }, HttpStatusCodes.OK);
  } catch (error) {
    // The club has not finished onboarding. Anything else is a real failure.
    if (error instanceof Error && error.message.includes("cannot take card")) {
      return c.json({ message: error.message }, HttpStatusCodes.CONFLICT);
    }
    throw error;
  }
};
