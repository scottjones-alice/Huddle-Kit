import { CONSENT_TYPES } from "@alice/database";
import {
  consentDocumentSelectSchema,
  consentSelectSchema,
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
  sessionErrors,
} from "@/lib/route-kit";

const TAGS = ["Consents"];

const documentBody = z.object({
  body: z.string().trim().min(1).max(20_000).describe("The full wording."),
  title: z.string().trim().min(1).max(200),
  type: z.enum(CONSENT_TYPES),
});

const grantBody = z.object({
  documentId: z
    .uuid()
    .nullish()
    .describe("The form version they agreed to. Its type must match."),
  expiresAt: z.iso.datetime({ offset: true }).nullish(),
  notes: z.string().trim().max(1000).nullish(),
  type: z.enum(CONSENT_TYPES),
});

const retiredQuery = z.object({
  includeRetired: includeArchivedQuery.shape.includeArchived.describe(
    "Also return versions that are no longer offered."
  ),
});

export const listDocuments = createRoute({
  description:
    "The wording of each consent form. Everyone in the club can read it.",
  method: "get",
  operationId: "listConsentForms",
  path: "/consent-forms",
  request: { query: retiredQuery },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ forms: z.array(consentDocumentSelectSchema) }),
      "The forms, by type and newest version first."
    ),
    ...sessionErrors,
  },
  summary: "List consent forms",
  tags: TAGS,
});

export const publishDocument = createRoute({
  description:
    "Publishes new wording as the next version for its type. Old versions are never edited, so every consent shows exactly what was agreed. Club admins only.",
  method: "post",
  operationId: "publishConsentForm",
  path: "/consent-forms",
  request: { body: jsonContentRequired(documentBody, "The form.") },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      consentDocumentSelectSchema,
      "The new version."
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Publish a consent form",
  tags: TAGS,
});

export const retireDocument = createRoute({
  description:
    "Stops offering a version. Consents already given against it stay valid. Club admins only.",
  method: "post",
  operationId: "retireConsentForm",
  path: "/consent-forms/{id}/retire",
  request: { params: idParams("consent form") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      consentDocumentSelectSchema,
      "The retired version."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("consent form"),
    ...sessionErrors,
  },
  summary: "Stop offering a consent form",
  tags: TAGS,
});

export const listConsents = createRoute({
  description:
    "Everything a person has agreed to, including what was withdrawn. You can see it for anyone you can see.",
  method: "get",
  operationId: "listConsents",
  path: "/people/{id}/consents",
  request: { params: idParams("person") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ consents: z.array(consentSelectSchema) }),
      "The consents, newest first."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("person"),
    ...sessionErrors,
  },
  summary: "List a person's consents",
  tags: TAGS,
});

export const grantConsent = createRoute({
  description:
    "Records that the person agreed. You can agree for yourself and your children, and a parent is recorded as the one who agreed for a child. Agreeing to the same thing twice is refused; withdraw first.",
  method: "post",
  operationId: "grantConsent",
  path: "/people/{id}/consents",
  request: {
    body: jsonContentRequired(grantBody, "What they agreed to."),
    params: idParams("person"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(consentSelectSchema, "The consent."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("person or consent form"),
    [HttpStatusCodes.CONFLICT]: errorBody("Already agreed to this."),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Give consent",
  tags: TAGS,
});

export const withdrawConsent = createRoute({
  description:
    "Takes consent back. The record stays, with the date it stopped.",
  method: "post",
  operationId: "withdrawConsent",
  path: "/consents/{id}/withdraw",
  request: { params: idParams("consent") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(consentSelectSchema, "The consent."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("consent"),
    [HttpStatusCodes.CONFLICT]: errorBody("Already withdrawn."),
    ...sessionErrors,
  },
  summary: "Withdraw consent",
  tags: TAGS,
});

export type ListDocumentsRoute = typeof listDocuments;
export type PublishDocumentRoute = typeof publishDocument;
export type RetireDocumentRoute = typeof retireDocument;
export type ListConsentsRoute = typeof listConsents;
export type GrantConsentRoute = typeof grantConsent;
export type WithdrawConsentRoute = typeof withdrawConsent;
