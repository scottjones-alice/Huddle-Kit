import { feeCharges, fees, payments, teamMemberships } from "@alice/database";
import type { ChargeStatus, Database, PaymentMethod } from "@alice/database";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  or,
  sql,
  sum,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { conflict, forbidden, invalid, notFound } from "@/lib/app-error";
import { guardWrite } from "@/lib/guard-write";
import { canManageMoney, requireMoneyAccess } from "@/services/access";
import type { Caller } from "@/services/access";
import { editablePersonIds } from "@/services/people";

export interface FeeInput {
  amountMinor: number;
  currency?: string;
  description?: string | null;
  dueOn?: string | null;
  name: string;
  seasonId: string;
  teamId?: string | null;
}

export type FeeChanges = Partial<Omit<FeeInput, "seasonId">> & {
  isActive?: boolean;
};

export const listFees = async (
  db: Database,
  organizationId: string,
  options: { includeArchived: boolean; seasonId?: string | undefined }
) => {
  const conditions: (SQL | undefined)[] = [
    eq(fees.organizationId, organizationId),
    options.includeArchived ? undefined : eq(fees.isActive, true),
    options.seasonId === undefined
      ? undefined
      : eq(fees.seasonId, options.seasonId),
  ];
  return await db
    .select()
    .from(fees)
    .where(and(...conditions))
    .orderBy(asc(fees.name));
};

export const createFee = async (
  db: Database,
  caller: Caller,
  input: FeeInput
) => {
  requireMoneyAccess(caller);
  const [row] = await guardWrite(
    async () =>
      await db
        .insert(fees)
        .values({ ...input, organizationId: caller.organizationId })
        .returning(),
    {
      invalid:
        "The amount must not be negative and the currency must be a three-letter code",
      missing: "Season or team",
    }
  );
  if (row === undefined) {
    throw new Error("Fee insert returned no row");
  }
  return row;
};

/** Changing a fee never changes charges already made; each kept the amount it was made with. */
export const updateFee = async (
  db: Database,
  caller: Caller,
  id: string,
  changes: FeeChanges
) => {
  requireMoneyAccess(caller);
  const [row] = await guardWrite(
    async () =>
      await db
        .update(fees)
        .set(changes)
        .where(
          and(eq(fees.organizationId, caller.organizationId), eq(fees.id, id))
        )
        .returning(),
    {
      invalid:
        "The amount must not be negative and the currency must be a three-letter code",
      missing: "Team",
    }
  );
  if (row === undefined) {
    throw notFound("Fee");
  }
  return row;
};

const getFee = async (db: Database, organizationId: string, id: string) => {
  const [fee] = await db
    .select()
    .from(fees)
    .where(and(eq(fees.organizationId, organizationId), eq(fees.id, id)));
  if (fee === undefined) {
    throw notFound("Fee");
  }
  return fee;
};

const today = (): string => new Date().toISOString().slice(0, 10);

/** Everyone currently on a team: no end date, or an end date still to come. */
const currentTeamPeople = async (
  db: Database,
  organizationId: string,
  teamId: string
): Promise<string[]> => {
  const rows = await db
    .select({ personId: teamMemberships.personId })
    .from(teamMemberships)
    .where(
      and(
        eq(teamMemberships.organizationId, organizationId),
        eq(teamMemberships.teamId, teamId),
        eq(teamMemberships.role, "player"),
        or(isNull(teamMemberships.endsOn), gt(teamMemberships.endsOn, today()))
      )
    );
  return [...new Set(rows.map((row) => row.personId))];
};

/**
 * Charges people for a fee. Name the people, or leave them out to charge
 * everyone playing in the fee's team. A person already charged is skipped.
 */
export const chargePeople = async (
  db: Database,
  caller: Caller,
  feeId: string,
  personIds?: string[]
) => {
  requireMoneyAccess(caller);
  const fee = await getFee(db, caller.organizationId, feeId);
  if (!fee.isActive) {
    throw conflict("This fee is archived");
  }
  let targets = personIds;
  if (targets === undefined) {
    if (fee.teamId === null) {
      throw invalid("Name the people to charge: this fee is not for one team");
    }
    targets = await currentTeamPeople(db, caller.organizationId, fee.teamId);
  }
  if (targets.length === 0) {
    return { created: 0 };
  }
  const inserted = await guardWrite(
    async () =>
      await db
        .insert(feeCharges)
        .values(
          targets.map((personId) => ({
            amountMinor: fee.amountMinor,
            currency: fee.currency,
            dueOn: fee.dueOn,
            feeId,
            organizationId: caller.organizationId,
            personId,
          }))
        )
        .onConflictDoNothing()
        .returning({ id: feeCharges.id }),
    { missing: "One of the people" }
  );
  return { created: inserted.length };
};

export interface ChargeFilters {
  feeId?: string | undefined;
  limit: number;
  offset: number;
  personId?: string | undefined;
  status?: ChargeStatus | undefined;
}

const paidTotal = sql<number>`coalesce((select sum(${payments.amountMinor}) from ${payments} where ${payments.chargeId} = ${feeCharges.id}), 0)::int`;

/** Treasurers and admins see every charge. Everyone else sees their own and their children's. */
export const listCharges = async (
  db: Database,
  caller: Caller,
  filters: ChargeFilters
) => {
  const editable = canManageMoney(caller)
    ? null
    : await editablePersonIds(db, caller);
  if (editable !== null && editable.length === 0) {
    return [];
  }
  const conditions: (SQL | undefined)[] = [
    eq(feeCharges.organizationId, caller.organizationId),
    editable === null ? undefined : inArray(feeCharges.personId, editable),
    filters.feeId === undefined
      ? undefined
      : eq(feeCharges.feeId, filters.feeId),
    filters.personId === undefined
      ? undefined
      : eq(feeCharges.personId, filters.personId),
    filters.status === undefined
      ? undefined
      : eq(feeCharges.status, filters.status),
  ];
  return await db
    .select({ charge: feeCharges, paidMinor: paidTotal })
    .from(feeCharges)
    .where(and(...conditions))
    .orderBy(desc(feeCharges.createdAt))
    .limit(filters.limit)
    .offset(filters.offset);
};

const getVisibleCharge = async (db: Database, caller: Caller, id: string) => {
  const [charge] = await db
    .select()
    .from(feeCharges)
    .where(
      and(
        eq(feeCharges.organizationId, caller.organizationId),
        eq(feeCharges.id, id)
      )
    );
  if (charge === undefined) {
    throw notFound("Charge");
  }
  if (!canManageMoney(caller)) {
    const editable = await editablePersonIds(db, caller);
    if (editable !== null && !editable.includes(charge.personId)) {
      throw notFound("Charge");
    }
  }
  return charge;
};

export const listPayments = async (
  db: Database,
  caller: Caller,
  chargeId: string
) => {
  await getVisibleCharge(db, caller, chargeId);
  return await db
    .select()
    .from(payments)
    .where(eq(payments.chargeId, chargeId))
    .orderBy(asc(payments.receivedAt));
};

export interface PaymentInput {
  amountMinor: number;
  method: Exclude<PaymentMethod, "card">;
  receivedAt?: Date | undefined;
  reference?: string | null;
}

/**
 * Records money received outside the app (cash, bank transfer, cheque). Card
 * payments are recorded by Stripe, never by hand. The charge becomes paid when
 * payments cover it, and a payment that would overpay is refused.
 */
export const recordPayment = async (
  db: Database,
  caller: Caller,
  chargeId: string,
  input: PaymentInput
) => {
  requireMoneyAccess(caller);
  return await db.transaction(async (tx) => {
    const [charge] = await tx
      .select()
      .from(feeCharges)
      .where(
        and(
          eq(feeCharges.organizationId, caller.organizationId),
          eq(feeCharges.id, chargeId)
        )
      )
      .for("update");
    if (charge === undefined) {
      throw notFound("Charge");
    }
    if (charge.status !== "due") {
      throw conflict(`This charge is ${charge.status}`);
    }
    const [paid] = await tx
      .select({ total: sum(payments.amountMinor) })
      .from(payments)
      .where(eq(payments.chargeId, chargeId));
    const already = Number(paid?.total ?? 0);
    if (already + input.amountMinor > charge.amountMinor) {
      throw invalid(
        `That is more than is owed: ${charge.amountMinor - already} left to pay`
      );
    }
    const [payment] = await tx
      .insert(payments)
      .values({
        amountMinor: input.amountMinor,
        chargeId,
        currency: charge.currency,
        method: input.method,
        organizationId: caller.organizationId,
        recordedByUserId: caller.userId,
        reference: input.reference ?? null,
        ...(input.receivedAt === undefined
          ? {}
          : { receivedAt: input.receivedAt }),
      })
      .returning();
    if (payment === undefined) {
      throw new Error("Payment insert returned no row");
    }
    if (already + input.amountMinor === charge.amountMinor) {
      await tx
        .update(feeCharges)
        .set({ status: "paid" })
        .where(eq(feeCharges.id, chargeId));
    }
    return payment;
  });
};

/** Waives (hardship) or cancels (made in error) a charge that is still due. Nothing is deleted. */
export const closeCharge = async (
  db: Database,
  caller: Caller,
  chargeId: string,
  outcome: { reason?: string | undefined; status: "cancelled" | "waived" }
) => {
  requireMoneyAccess(caller);
  const reason = outcome.reason?.trim() ?? "";
  if (outcome.status === "waived" && reason.length === 0) {
    throw invalid("A waived charge needs a reason");
  }
  const charge = await getVisibleCharge(db, caller, chargeId);
  if (charge.status !== "due") {
    throw conflict(`This charge is already ${charge.status}`);
  }
  const [row] = await db
    .update(feeCharges)
    .set({
      status: outcome.status,
      waivedReason: reason.length === 0 ? null : reason,
    })
    .where(eq(feeCharges.id, chargeId))
    .returning();
  if (row === undefined) {
    throw forbidden("The charge could not be changed");
  }
  return row;
};
