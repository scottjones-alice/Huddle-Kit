import { feeCharges, payments } from "@alice/database";
import { paymentInsertSchema } from "@alice/database/validation";
import type { MemberPayment } from "@alice/payments";
import { eq, sum } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/services/database";

export type RecordOutcome =
  | "recorded"
  | "duplicate"
  | "unknown_account"
  | "unknown_charge"
  | "currency_mismatch";

const chargeIdSchema = z.uuid();

/**
 * Records a member's card payment from a verified webhook and marks the charge
 * paid once payments cover it. The club comes from the connected account the
 * event arrived on, never from the payload, and the payment intent id is
 * unique per club (see payments_card_reference_uidx), so a redelivered event
 * is a "duplicate" and changes nothing.
 */
export const recordMemberPayment = async (
  payment: MemberPayment
): Promise<RecordOutcome> => {
  const account = await db.query.clubStripeAccounts.findFirst({
    where: { stripeAccountId: payment.accountId },
  });
  if (account === undefined) {
    return "unknown_account";
  }
  const { organizationId } = account;

  const chargeId = chargeIdSchema.safeParse(payment.chargeId);
  if (!chargeId.success) {
    return "unknown_charge";
  }
  const charge = await db.query.feeCharges.findFirst({
    where: { id: chargeId.data, organizationId },
  });
  if (charge === undefined) {
    return "unknown_charge";
  }
  if (charge.currency !== payment.currency) {
    return "currency_mismatch";
  }

  const row = paymentInsertSchema.parse({
    amountMinor: payment.amountMinor,
    chargeId: charge.id,
    currency: payment.currency,
    method: "card",
    organizationId,
    reference: payment.paymentIntentId,
  });

  return await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(payments)
      .values(row)
      .onConflictDoNothing()
      .returning({ id: payments.id });
    if (inserted.length === 0) {
      return "duplicate";
    }

    const [paid] = await tx
      .select({ total: sum(payments.amountMinor) })
      .from(payments)
      .where(eq(payments.chargeId, charge.id));
    if (
      Number(paid?.total ?? 0) >= charge.amountMinor &&
      charge.status === "due"
    ) {
      await tx
        .update(feeCharges)
        .set({ status: "paid" })
        .where(eq(feeCharges.id, charge.id));
    }
    return "recorded";
  });
};

/** What is still owed on a charge: its amount less the payments recorded so far. */
export const amountOwedMinor = async (
  chargeId: string,
  chargeAmountMinor: number
): Promise<number> => {
  const [paid] = await db
    .select({ total: sum(payments.amountMinor) })
    .from(payments)
    .where(eq(payments.chargeId, chargeId));
  return chargeAmountMinor - Number(paid?.total ?? 0);
};

export const findClubAccount = async (organizationId: string) =>
  await db.query.clubStripeAccounts.findFirst({ where: { organizationId } });
