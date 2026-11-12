import { CHARGE_STATUSES } from "@alice/database";
import {
  feeChargeSelectSchema,
  feeSelectSchema,
  paymentSelectSchema,
} from "@alice/database/validation";
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import {
  errorBody,
  idParams,
  includeArchivedQuery,
  invalidBody,
  notFoundBody,
  pageQuery,
  sessionErrors,
} from "@/lib/route-kit";

const TAGS = ["Fees"];

const minor = z
  .number()
  .int()
  .min(0)
  .max(10_000_000)
  .describe("Whole pence or cents: 2500 is 25.00.");

const feeBody = z.object({
  amountMinor: minor,
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/u)
    .optional()
    .describe("Three capital letters, such as GBP. Defaults to GBP."),
  description: z.string().trim().max(500).nullish(),
  dueOn: z.iso.date().nullish(),
  name: z.string().trim().min(1).max(120),
  seasonId: z.uuid(),
  teamId: z.uuid().nullish().describe("Leave out to charge the whole club."),
});

const feeChanges = feeBody
  .omit({ seasonId: true })
  .partial()
  .extend({
    isActive: z
      .boolean()
      .optional()
      .describe("false archives the fee. Charges already made stay."),
  });

const chargeRow = z.object({
  charge: feeChargeSelectSchema,
  paidMinor: z.number().int().describe("How much has been paid so far."),
});

const listFeesQuery = includeArchivedQuery.extend({
  seasonId: z.uuid().optional().describe("Only this season's fees."),
});

const listChargesQuery = pageQuery.extend({
  feeId: z.uuid().optional().describe("Only charges for this fee."),
  personId: z.uuid().optional().describe("Only this person's charges."),
  status: z.enum(CHARGE_STATUSES).optional().describe("Only this status."),
});

const paymentBody = z.object({
  amountMinor: minor.min(1),
  method: z.enum(["cash", "bank_transfer", "cheque", "other"]),
  receivedAt: z.iso.datetime({ offset: true }).optional(),
  reference: z.string().trim().max(120).nullish(),
});

export const listFees = createRoute({
  description: "The club's fee schedule. Everyone in the club can see it.",
  method: "get",
  operationId: "listFees",
  path: "/fees",
  request: { query: listFeesQuery },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ fees: z.array(feeSelectSchema) }),
      "The fees."
    ),
    ...sessionErrors,
  },
  summary: "List fees",
  tags: TAGS,
});

export const createFee = createRoute({
  description:
    "Adds a fee, such as subs or kit. Club admins and the treasurer only. Nobody owes it until they are charged.",
  method: "post",
  operationId: "createFee",
  path: "/fees",
  request: { body: jsonContentRequired(feeBody, "The fee.") },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(feeSelectSchema, "The new fee."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("season or team"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Add a fee",
  tags: TAGS,
});

export const updateFee = createRoute({
  description:
    "Changes or archives a fee. Charges already made keep the amount they were made with.",
  method: "patch",
  operationId: "updateFee",
  path: "/fees/{id}",
  request: {
    body: jsonContentRequired(feeChanges, "The fields to change."),
    params: idParams("fee"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(feeSelectSchema, "The updated fee."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("fee"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Change or archive a fee",
  tags: TAGS,
});

export const chargePeople = createRoute({
  description:
    "Charges people for this fee. Name the people, or leave them out to charge every player on the fee's team. Anyone already charged is skipped.",
  method: "post",
  operationId: "chargePeople",
  path: "/fees/{id}/charges",
  request: {
    body: jsonContentRequired(
      z.object({
        personIds: z.array(z.uuid()).min(1).max(500).optional(),
      }),
      "Who to charge."
    ),
    params: idParams("fee"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({ created: z.number().int() }),
      "How many new charges were made."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("fee or person"),
    [HttpStatusCodes.CONFLICT]: errorBody("The fee is archived."),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Charge people for a fee",
  tags: TAGS,
});

export const listCharges = createRoute({
  description:
    "The treasurer and club admins see every charge. Everyone else sees their own and their children's.",
  method: "get",
  operationId: "listCharges",
  path: "/charges",
  request: { query: listChargesQuery },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ charges: z.array(chargeRow) }),
      "The charges, newest first."
    ),
    ...sessionErrors,
  },
  summary: "List charges",
  tags: TAGS,
});

export const listPayments = createRoute({
  method: "get",
  operationId: "listChargePayments",
  path: "/charges/{id}/payments",
  request: { params: idParams("charge") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ payments: z.array(paymentSelectSchema) }),
      "The payments so far."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("charge"),
    ...sessionErrors,
  },
  summary: "List payments on a charge",
  tags: TAGS,
});

export const recordPayment = createRoute({
  description:
    "Records cash, a bank transfer or a cheque. Card payments are recorded by Stripe, not by hand. A payment that would pay too much is refused, and payments are never edited or deleted.",
  method: "post",
  operationId: "recordPayment",
  path: "/charges/{id}/payments",
  request: {
    body: jsonContentRequired(paymentBody, "The money received."),
    params: idParams("charge"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      paymentSelectSchema,
      "The recorded payment."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("charge"),
    [HttpStatusCodes.CONFLICT]: errorBody("The charge is not due any more."),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Record a payment",
  tags: TAGS,
});

export const closeCharge = createRoute({
  description:
    "Waives a charge for hardship (a reason is required) or cancels one made by mistake. The charge stays on record.",
  method: "post",
  operationId: "closeCharge",
  path: "/charges/{id}/close",
  request: {
    body: jsonContentRequired(
      z.object({
        reason: z.string().trim().max(500).optional(),
        status: z.enum(["waived", "cancelled"]),
      }),
      "Waive or cancel, and why."
    ),
    params: idParams("charge"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      feeChargeSelectSchema,
      "The updated charge."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("charge"),
    [HttpStatusCodes.CONFLICT]: errorBody("The charge is not due any more."),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Waive or cancel a charge",
  tags: TAGS,
});

export type ListFeesRoute = typeof listFees;
export type CreateFeeRoute = typeof createFee;
export type UpdateFeeRoute = typeof updateFee;
export type ChargePeopleRoute = typeof chargePeople;
export type ListChargesRoute = typeof listCharges;
export type ListPaymentsRoute = typeof listPayments;
export type RecordPaymentRoute = typeof recordPayment;
export type CloseChargeRoute = typeof closeCharge;
