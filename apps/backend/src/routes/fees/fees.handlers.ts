import {
  feeChargeSelectSchema,
  feeSelectSchema,
  paymentSelectSchema,
} from "@alice/database/validation";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { callerOf } from "@/lib/caller";
import { isTrue } from "@/lib/schemas";
import { db } from "@/services/database";
import {
  chargePeople as chargePeopleRows,
  closeCharge as closeChargeRow,
  createFee as createFeeRow,
  listCharges as listChargeRows,
  listFees as listFeeRows,
  listPayments as listPaymentRows,
  recordPayment as recordPaymentRow,
  updateFee as updateFeeRow,
} from "@/services/fees";
import type { AuthedRouteHandler } from "@/types";

import type {
  ChargePeopleRoute,
  CloseChargeRoute,
  CreateFeeRoute,
  ListChargesRoute,
  ListFeesRoute,
  ListPaymentsRoute,
  RecordPaymentRoute,
  UpdateFeeRoute,
} from "./fees.route";

export const listFees: AuthedRouteHandler<ListFeesRoute> = async (c) => {
  await callerOf(c);
  const { includeArchived, seasonId } = c.req.valid("query");
  const rows = await listFeeRows(db, c.get("organizationId"), {
    includeArchived: isTrue(includeArchived),
    seasonId,
  });
  return c.json(
    { fees: feeSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const createFee: AuthedRouteHandler<CreateFeeRoute> = async (c) => {
  const caller = await callerOf(c);
  const row = await createFeeRow(db, caller, c.req.valid("json"));
  return c.json(feeSelectSchema.parse(row), HttpStatusCodes.CREATED);
};

export const updateFee: AuthedRouteHandler<UpdateFeeRoute> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const row = await updateFeeRow(db, caller, id, c.req.valid("json"));
  return c.json(feeSelectSchema.parse(row), HttpStatusCodes.OK);
};

export const chargePeople: AuthedRouteHandler<ChargePeopleRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const { personIds } = c.req.valid("json");
  const result = await chargePeopleRows(db, caller, id, personIds);
  return c.json(result, HttpStatusCodes.CREATED);
};

export const listCharges: AuthedRouteHandler<ListChargesRoute> = async (c) => {
  const caller = await callerOf(c);
  const rows = await listChargeRows(db, caller, c.req.valid("query"));
  return c.json(
    {
      charges: rows.map((row) => ({
        charge: feeChargeSelectSchema.parse(row.charge),
        paidMinor: row.paidMinor,
      })),
    },
    HttpStatusCodes.OK
  );
};

export const listPayments: AuthedRouteHandler<ListPaymentsRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const rows = await listPaymentRows(db, caller, id);
  return c.json(
    { payments: paymentSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const recordPayment: AuthedRouteHandler<RecordPaymentRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const { receivedAt, ...rest } = c.req.valid("json");
  const row = await recordPaymentRow(db, caller, id, {
    ...rest,
    receivedAt: receivedAt === undefined ? undefined : new Date(receivedAt),
  });
  return c.json(paymentSelectSchema.parse(row), HttpStatusCodes.CREATED);
};

export const closeCharge: AuthedRouteHandler<CloseChargeRoute> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const row = await closeChargeRow(db, caller, id, c.req.valid("json"));
  return c.json(feeChargeSelectSchema.parse(row), HttpStatusCodes.OK);
};
