import {
  ALLERGY_SEVERITIES,
  INCIDENT_KINDS,
  INCIDENT_SEVERITIES,
  MEDICAL_RECORD_KINDS,
  QUALIFICATION_KINDS,
} from "@alice/database";
import {
  allergySelectSchema,
  incidentReportSelectSchema,
  medicalRecordSelectSchema,
  qualificationSelectSchema,
} from "@alice/database/validation";
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import {
  errorBody,
  idParams,
  invalidBody,
  notFoundBody,
  pageQuery,
  sessionErrors,
} from "@/lib/route-kit";

const TAGS = ["Welfare"];

const when = z.iso.datetime({ offset: true });

const medicalBody = z.object({
  details: z.string().trim().max(2000).nullish(),
  emergencyNotes: z
    .string()
    .trim()
    .max(1000)
    .nullish()
    .describe("What a first aider should do."),
  endedOn: z.iso.date().nullish().describe("Set when it no longer applies."),
  isEmergencyRelevant: z
    .boolean()
    .optional()
    .describe("Show to whoever is first on the scene."),
  kind: z.enum(MEDICAL_RECORD_KINDS),
  name: z.string().trim().min(1).max(150),
  startedOn: z.iso.date().nullish(),
});

const medicalChanges = medicalBody.partial();

const allergyBody = z.object({
  allergen: z.string().trim().min(1).max(100),
  reaction: z.string().trim().max(300).nullish(),
  severity: z.enum(ALLERGY_SEVERITIES),
  treatment: z.string().trim().max(500).nullish(),
});

const allergyChanges = allergyBody.partial().extend({
  archived: z
    .boolean()
    .optional()
    .describe("true when it no longer applies. It stays in the history."),
});

const incidentBody = z.object({
  actionTaken: z.string().trim().max(1000).nullish(),
  description: z.string().trim().min(1).max(4000),
  firstAiderPersonId: z.uuid().nullish(),
  followUpRequired: z.boolean().optional(),
  kind: z.enum(INCIDENT_KINDS),
  occurredAt: when,
  parentsNotifiedAt: when.nullish(),
  personId: z.uuid().describe("Who it happened to."),
  severity: z.enum(INCIDENT_SEVERITIES),
  teamId: z.uuid().nullish(),
  venueId: z.uuid().nullish(),
});

const incidentChanges = z.object({
  actionTaken: z.string().trim().max(1000).nullish(),
  followUpRequired: z.boolean().optional(),
  parentsNotifiedAt: when.nullish(),
});

const incidentQuery = pageQuery.extend({
  from: when.optional().describe("Only incidents at or after this."),
  personId: z.uuid().optional().describe("Only this person."),
  teamId: z.uuid().optional().describe("Only this team."),
  to: when.optional().describe("Only incidents before this."),
});

const qualificationBody = z.object({
  awardedBy: z.string().trim().max(120).nullish(),
  expiresOn: z.iso.date().nullish(),
  fileId: z.uuid().nullish(),
  issuedOn: z.iso.date().nullish(),
  kind: z.enum(QUALIFICATION_KINDS),
  reference: z.string().trim().max(120).nullish(),
  title: z.string().trim().min(1).max(150),
});

const qualificationChanges = qualificationBody.partial();

export const getHealth = createRoute({
  description:
    "A person's medical records and allergies. Seen by the person, their parents, club admins and the coaches of their teams. Every read is recorded in the audit log.",
  method: "get",
  operationId: "getHealth",
  path: "/people/{id}/health",
  request: { params: idParams("person") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        allergies: z.array(allergySelectSchema),
        medicalRecords: z.array(medicalRecordSelectSchema),
      }),
      "Their health information."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("person"),
    ...sessionErrors,
  },
  summary: "Get a person's health information",
  tags: TAGS,
});

export const addMedicalRecord = createRoute({
  description:
    "Adds a condition, medication or disability. Only the person, their parents or a club admin can.",
  method: "post",
  operationId: "addMedicalRecord",
  path: "/people/{id}/medical-records",
  request: {
    body: jsonContentRequired(medicalBody, "The record."),
    params: idParams("person"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      medicalRecordSelectSchema,
      "The record."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("person"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Add a medical record",
  tags: TAGS,
});

export const updateMedicalRecord = createRoute({
  description:
    "Changes a record. Set endedOn when it no longer applies rather than removing it.",
  method: "patch",
  operationId: "updateMedicalRecord",
  path: "/medical-records/{id}",
  request: {
    body: jsonContentRequired(medicalChanges, "The fields to change."),
    params: idParams("medical record"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      medicalRecordSelectSchema,
      "The updated record."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("medical record"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Change a medical record",
  tags: TAGS,
});

export const addAllergy = createRoute({
  method: "post",
  operationId: "addAllergy",
  path: "/people/{id}/allergies",
  request: {
    body: jsonContentRequired(allergyBody, "The allergy."),
    params: idParams("person"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(allergySelectSchema, "The allergy."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("person"),
    [HttpStatusCodes.CONFLICT]: errorBody("This allergy is already recorded."),
    ...sessionErrors,
  },
  summary: "Add an allergy",
  tags: TAGS,
});

export const updateAllergy = createRoute({
  method: "patch",
  operationId: "updateAllergy",
  path: "/allergies/{id}",
  request: {
    body: jsonContentRequired(allergyChanges, "The fields to change."),
    params: idParams("allergy"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(allergySelectSchema, "The allergy."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("allergy"),
    [HttpStatusCodes.CONFLICT]: errorBody("This allergy is already recorded."),
    ...sessionErrors,
  },
  summary: "Change or archive an allergy",
  tags: TAGS,
});

export const listIncidents = createRoute({
  description:
    "Incident reports about people you can see: a parent sees their child's, a coach sees those on their teams, a club admin sees all.",
  method: "get",
  operationId: "listIncidents",
  path: "/incidents",
  request: { query: incidentQuery },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ incidents: z.array(incidentReportSelectSchema) }),
      "The reports, newest first."
    ),
    ...sessionErrors,
  },
  summary: "List incident reports",
  tags: TAGS,
});

export const createIncident = createRoute({
  description:
    "Writes up an accident, injury, illness or welfare incident. Coaches and club admins only. Reports are never deleted.",
  method: "post",
  operationId: "createIncident",
  path: "/incidents",
  request: { body: jsonContentRequired(incidentBody, "What happened.") },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      incidentReportSelectSchema,
      "The report."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("person, team or venue"),
    ...sessionErrors,
  },
  summary: "Write an incident report",
  tags: TAGS,
});

export const getIncident = createRoute({
  method: "get",
  operationId: "getIncident",
  path: "/incidents/{id}",
  request: { params: idParams("incident report") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      incidentReportSelectSchema,
      "The report."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("incident report"),
    ...sessionErrors,
  },
  summary: "Read an incident report",
  tags: TAGS,
});

export const updateIncident = createRoute({
  description:
    "Adds what was done, marks follow-up, or records when parents were told. Only the person who wrote it, or a club admin.",
  method: "patch",
  operationId: "updateIncident",
  path: "/incidents/{id}",
  request: {
    body: jsonContentRequired(incidentChanges, "The fields to change."),
    params: idParams("incident report"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      incidentReportSelectSchema,
      "The updated report."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("incident report"),
    ...sessionErrors,
  },
  summary: "Add to an incident report",
  tags: TAGS,
});

export const listQualifications = createRoute({
  method: "get",
  operationId: "listQualifications",
  path: "/people/{id}/qualifications",
  request: { params: idParams("person") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ qualifications: z.array(qualificationSelectSchema) }),
      "Their coaching and refereeing qualifications."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("person"),
    ...sessionErrors,
  },
  summary: "List qualifications",
  tags: TAGS,
});

export const addQualification = createRoute({
  description:
    "Adds a coaching or refereeing badge. DBS, safeguarding training and first aid are checks, kept under Safeguarding.",
  method: "post",
  operationId: "addQualification",
  path: "/people/{id}/qualifications",
  request: {
    body: jsonContentRequired(qualificationBody, "The qualification."),
    params: idParams("person"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      qualificationSelectSchema,
      "The qualification."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("person or file"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Add a qualification",
  tags: TAGS,
});

export const updateQualification = createRoute({
  method: "patch",
  operationId: "updateQualification",
  path: "/qualifications/{id}",
  request: {
    body: jsonContentRequired(qualificationChanges, "The fields to change."),
    params: idParams("qualification"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      qualificationSelectSchema,
      "The updated qualification."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("qualification"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Change a qualification",
  tags: TAGS,
});

export type GetHealthRoute = typeof getHealth;
export type AddMedicalRecordRoute = typeof addMedicalRecord;
export type UpdateMedicalRecordRoute = typeof updateMedicalRecord;
export type AddAllergyRoute = typeof addAllergy;
export type UpdateAllergyRoute = typeof updateAllergy;
export type ListIncidentsRoute = typeof listIncidents;
export type CreateIncidentRoute = typeof createIncident;
export type GetIncidentRoute = typeof getIncident;
export type UpdateIncidentRoute = typeof updateIncident;
export type ListQualificationsRoute = typeof listQualifications;
export type AddQualificationRoute = typeof addQualification;
export type UpdateQualificationRoute = typeof updateQualification;
