import {
  allergySelectSchema,
  incidentReportSelectSchema,
  medicalRecordSelectSchema,
  qualificationSelectSchema,
} from "@alice/database/validation";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { callerOf } from "@/lib/caller";
import { db } from "@/services/database";
import {
  addAllergy as addAllergyRow,
  addMedicalRecord as addMedicalRecordRow,
  addQualification as addQualificationRow,
  createIncident as createIncidentRow,
  getHealth as getHealthRows,
  getIncident as getIncidentRow,
  listIncidents as listIncidentRows,
  listQualifications as listQualificationRows,
  updateAllergy as updateAllergyRow,
  updateIncident as updateIncidentRow,
  updateMedicalRecord as updateMedicalRecordRow,
  updateQualification as updateQualificationRow,
} from "@/services/welfare";
import type { AuthedRouteHandler } from "@/types";

import type {
  AddAllergyRoute,
  AddMedicalRecordRoute,
  AddQualificationRoute,
  CreateIncidentRoute,
  GetHealthRoute,
  GetIncidentRoute,
  ListIncidentsRoute,
  ListQualificationsRoute,
  UpdateAllergyRoute,
  UpdateIncidentRoute,
  UpdateMedicalRecordRoute,
  UpdateQualificationRoute,
} from "./welfare.route";

const toDate = (value: string | null | undefined): Date | null | undefined =>
  value === null || value === undefined ? value : new Date(value);

export const getHealth: AuthedRouteHandler<GetHealthRoute> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const result = await getHealthRows(db, caller, id);
  return c.json(
    {
      allergies: allergySelectSchema.array().parse(result.allergies),
      medicalRecords: medicalRecordSelectSchema
        .array()
        .parse(result.medicalRecords),
    },
    HttpStatusCodes.OK
  );
};

export const addMedicalRecord: AuthedRouteHandler<
  AddMedicalRecordRoute
> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const row = await addMedicalRecordRow(db, caller, id, c.req.valid("json"));
  return c.json(medicalRecordSelectSchema.parse(row), HttpStatusCodes.CREATED);
};

export const updateMedicalRecord: AuthedRouteHandler<
  UpdateMedicalRecordRoute
> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const row = await updateMedicalRecordRow(db, caller, id, c.req.valid("json"));
  return c.json(medicalRecordSelectSchema.parse(row), HttpStatusCodes.OK);
};

export const addAllergy: AuthedRouteHandler<AddAllergyRoute> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const row = await addAllergyRow(db, caller, id, c.req.valid("json"));
  return c.json(allergySelectSchema.parse(row), HttpStatusCodes.CREATED);
};

export const updateAllergy: AuthedRouteHandler<UpdateAllergyRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const row = await updateAllergyRow(db, caller, id, c.req.valid("json"));
  return c.json(allergySelectSchema.parse(row), HttpStatusCodes.OK);
};

export const listIncidents: AuthedRouteHandler<ListIncidentsRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { from, to, ...rest } = c.req.valid("query");
  const rows = await listIncidentRows(db, caller, {
    ...rest,
    from: from === undefined ? undefined : new Date(from),
    to: to === undefined ? undefined : new Date(to),
  });
  return c.json(
    { incidents: incidentReportSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const createIncident: AuthedRouteHandler<CreateIncidentRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { occurredAt, parentsNotifiedAt, ...rest } = c.req.valid("json");
  const row = await createIncidentRow(db, caller, {
    ...rest,
    occurredAt: new Date(occurredAt),
    parentsNotifiedAt: toDate(parentsNotifiedAt),
  });
  return c.json(incidentReportSelectSchema.parse(row), HttpStatusCodes.CREATED);
};

export const getIncident: AuthedRouteHandler<GetIncidentRoute> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const row = await getIncidentRow(db, caller, id);
  return c.json(incidentReportSelectSchema.parse(row), HttpStatusCodes.OK);
};

export const updateIncident: AuthedRouteHandler<UpdateIncidentRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const { parentsNotifiedAt, ...rest } = c.req.valid("json");
  const row = await updateIncidentRow(db, caller, id, {
    ...rest,
    ...(parentsNotifiedAt === undefined
      ? {}
      : { parentsNotifiedAt: toDate(parentsNotifiedAt) ?? null }),
  });
  return c.json(incidentReportSelectSchema.parse(row), HttpStatusCodes.OK);
};

export const listQualifications: AuthedRouteHandler<
  ListQualificationsRoute
> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const rows = await listQualificationRows(db, caller, id);
  return c.json(
    { qualifications: qualificationSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const addQualification: AuthedRouteHandler<
  AddQualificationRoute
> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const row = await addQualificationRow(db, caller, id, c.req.valid("json"));
  return c.json(qualificationSelectSchema.parse(row), HttpStatusCodes.CREATED);
};

export const updateQualification: AuthedRouteHandler<
  UpdateQualificationRoute
> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const row = await updateQualificationRow(db, caller, id, c.req.valid("json"));
  return c.json(qualificationSelectSchema.parse(row), HttpStatusCodes.OK);
};
