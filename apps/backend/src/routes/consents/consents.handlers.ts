import {
  consentDocumentSelectSchema,
  consentSelectSchema,
} from "@alice/database/validation";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { callerOf } from "@/lib/caller";
import { isTrue } from "@/lib/schemas";
import {
  grantConsent as grantConsentRow,
  listConsents as listConsentRows,
  listDocuments as listDocumentRows,
  publishDocument as publishDocumentRow,
  retireDocument as retireDocumentRow,
  withdrawConsent as withdrawConsentRow,
} from "@/services/consents";
import { db } from "@/services/database";
import type { AuthedRouteHandler } from "@/types";

import type {
  GrantConsentRoute,
  ListConsentsRoute,
  ListDocumentsRoute,
  PublishDocumentRoute,
  RetireDocumentRoute,
  WithdrawConsentRoute,
} from "./consents.route";

export const listDocuments: AuthedRouteHandler<ListDocumentsRoute> = async (
  c
) => {
  await callerOf(c);
  const { includeRetired } = c.req.valid("query");
  const rows = await listDocumentRows(
    db,
    c.get("organizationId"),
    isTrue(includeRetired)
  );
  return c.json(
    { forms: consentDocumentSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const publishDocument: AuthedRouteHandler<PublishDocumentRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const row = await publishDocumentRow(db, caller, c.req.valid("json"));
  return c.json(
    consentDocumentSelectSchema.parse(row),
    HttpStatusCodes.CREATED
  );
};

export const retireDocument: AuthedRouteHandler<RetireDocumentRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const row = await retireDocumentRow(db, caller, id);
  return c.json(consentDocumentSelectSchema.parse(row), HttpStatusCodes.OK);
};

export const listConsents: AuthedRouteHandler<ListConsentsRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const rows = await listConsentRows(db, caller, id);
  return c.json(
    { consents: consentSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const grantConsent: AuthedRouteHandler<GrantConsentRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const { expiresAt, ...rest } = c.req.valid("json");
  const row = await grantConsentRow(db, caller, id, {
    ...rest,
    expiresAt:
      expiresAt === null || expiresAt === undefined
        ? null
        : new Date(expiresAt),
  });
  return c.json(consentSelectSchema.parse(row), HttpStatusCodes.CREATED);
};

export const withdrawConsent: AuthedRouteHandler<WithdrawConsentRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const row = await withdrawConsentRow(db, caller, id);
  return c.json(consentSelectSchema.parse(row), HttpStatusCodes.OK);
};
