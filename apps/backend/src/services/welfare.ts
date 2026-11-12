import {
  allergies,
  incidentReports,
  medicalRecords,
  qualifications,
  recordAuditEvent,
} from "@alice/database";
import type {
  AllergySeverity,
  Database,
  IncidentKind,
  IncidentSeverity,
  MedicalRecordKind,
  QualificationKind,
} from "@alice/database";
import { and, asc, desc, eq, gte, inArray, lt } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { forbidden, notFound } from "@/lib/app-error";
import { guardWrite } from "@/lib/guard-write";
import { canCoachTeam, isCoachOrManager } from "@/services/access";
import type { Caller } from "@/services/access";
import {
  assertCanEdit,
  assertCanSee,
  visiblePersonIds,
} from "@/services/people";

const audit = async (
  db: Database,
  caller: Caller,
  action: string,
  entityType: string,
  entityId: string
): Promise<void> => {
  await recordAuditEvent(db, {
    action,
    actorUserId: caller.userId,
    entityId,
    entityType,
    organizationId: caller.organizationId,
  });
};

/* ------------------------------------------------------------ health ----- */

/**
 * A person's medical records and allergies. Seen by the person, their
 * parents, club admins and the coaches of their teams (they need it at
 * training). Every read is recorded in the audit log.
 */
export const getHealth = async (
  db: Database,
  caller: Caller,
  personId: string
) => {
  await assertCanSee(db, caller, personId);
  const [records, allergyRows] = await Promise.all([
    db
      .select()
      .from(medicalRecords)
      .where(
        and(
          eq(medicalRecords.organizationId, caller.organizationId),
          eq(medicalRecords.personId, personId)
        )
      )
      .orderBy(asc(medicalRecords.name)),
    db
      .select()
      .from(allergies)
      .where(
        and(
          eq(allergies.organizationId, caller.organizationId),
          eq(allergies.personId, personId)
        )
      )
      .orderBy(asc(allergies.allergen)),
  ]);
  await audit(db, caller, "medical_record.read", "person", personId);
  return { allergies: allergyRows, medicalRecords: records };
};

export interface MedicalInput {
  details?: string | null;
  emergencyNotes?: string | null;
  endedOn?: string | null;
  isEmergencyRelevant?: boolean;
  kind: MedicalRecordKind;
  name: string;
  startedOn?: string | null;
}

/** Only the person, their parents or a club admin can add or change health information. */
export const addMedicalRecord = async (
  db: Database,
  caller: Caller,
  personId: string,
  input: MedicalInput
) => {
  await assertCanEdit(db, caller, personId);
  const [row] = await guardWrite(
    async () =>
      await db
        .insert(medicalRecords)
        .values({ ...input, organizationId: caller.organizationId, personId })
        .returning(),
    { invalid: "It cannot end before it started", missing: "Person" }
  );
  if (row === undefined) {
    throw new Error("Medical record insert returned no row");
  }
  await audit(db, caller, "medical_record.create", "medical_record", row.id);
  return row;
};

export const updateMedicalRecord = async (
  db: Database,
  caller: Caller,
  id: string,
  changes: Partial<MedicalInput>
) => {
  const [current] = await db
    .select()
    .from(medicalRecords)
    .where(
      and(
        eq(medicalRecords.organizationId, caller.organizationId),
        eq(medicalRecords.id, id)
      )
    );
  if (current === undefined) {
    throw notFound("Medical record");
  }
  await assertCanEdit(db, caller, current.personId);
  const [row] = await guardWrite(
    async () =>
      await db
        .update(medicalRecords)
        .set(changes)
        .where(eq(medicalRecords.id, id))
        .returning(),
    { invalid: "It cannot end before it started" }
  );
  if (row === undefined) {
    throw notFound("Medical record");
  }
  await audit(db, caller, "medical_record.update", "medical_record", id);
  return row;
};

export interface AllergyInput {
  allergen: string;
  reaction?: string | null;
  severity: AllergySeverity;
  treatment?: string | null;
}

export const addAllergy = async (
  db: Database,
  caller: Caller,
  personId: string,
  input: AllergyInput
) => {
  await assertCanEdit(db, caller, personId);
  const [row] = await guardWrite(
    async () =>
      await db
        .insert(allergies)
        .values({ ...input, organizationId: caller.organizationId, personId })
        .returning(),
    {
      missing: "Person",
      taken: "This allergy is already recorded. Change that one instead",
    }
  );
  if (row === undefined) {
    throw new Error("Allergy insert returned no row");
  }
  await audit(db, caller, "allergy.create", "allergy", row.id);
  return row;
};

/** `archived: true` marks an allergy as no longer applying. It stays in the history. */
export const updateAllergy = async (
  db: Database,
  caller: Caller,
  id: string,
  changes: Partial<AllergyInput> & { archived?: boolean }
) => {
  const [current] = await db
    .select()
    .from(allergies)
    .where(
      and(
        eq(allergies.organizationId, caller.organizationId),
        eq(allergies.id, id)
      )
    );
  if (current === undefined) {
    throw notFound("Allergy");
  }
  await assertCanEdit(db, caller, current.personId);
  const { archived, ...rest } = changes;
  const [row] = await guardWrite(
    async () =>
      await db
        .update(allergies)
        .set({
          ...rest,
          ...(archived === undefined
            ? {}
            : {
                archivedAt: archived
                  ? (current.archivedAt ?? new Date())
                  : null,
              }),
        })
        .where(eq(allergies.id, id))
        .returning(),
    { taken: "This allergy is already recorded" }
  );
  if (row === undefined) {
    throw notFound("Allergy");
  }
  await audit(db, caller, "allergy.update", "allergy", id);
  return row;
};

/* --------------------------------------------------------- incidents ----- */

export interface IncidentFilters {
  from?: Date | undefined;
  limit: number;
  offset: number;
  personId?: string | undefined;
  teamId?: string | undefined;
  to?: Date | undefined;
}

/**
 * Incident reports about people the caller may see: a parent sees their
 * child's, a coach sees those on their teams, a club admin sees all.
 */
export const listIncidents = async (
  db: Database,
  caller: Caller,
  filters: IncidentFilters
) => {
  const visible = await visiblePersonIds(db, caller);
  if (visible !== null && visible.length === 0) {
    return [];
  }
  const conditions: (SQL | undefined)[] = [
    eq(incidentReports.organizationId, caller.organizationId),
    visible === null ? undefined : inArray(incidentReports.personId, visible),
    filters.personId === undefined
      ? undefined
      : eq(incidentReports.personId, filters.personId),
    filters.teamId === undefined
      ? undefined
      : eq(incidentReports.teamId, filters.teamId),
    filters.from === undefined
      ? undefined
      : gte(incidentReports.occurredAt, filters.from),
    filters.to === undefined
      ? undefined
      : lt(incidentReports.occurredAt, filters.to),
  ];
  return await db
    .select()
    .from(incidentReports)
    .where(and(...conditions))
    .orderBy(desc(incidentReports.occurredAt))
    .limit(filters.limit)
    .offset(filters.offset);
};

const getIncidentRow = async (db: Database, caller: Caller, id: string) => {
  const [row] = await db
    .select()
    .from(incidentReports)
    .where(
      and(
        eq(incidentReports.organizationId, caller.organizationId),
        eq(incidentReports.id, id)
      )
    );
  if (row === undefined) {
    throw notFound("Incident report");
  }
  await assertCanSee(db, caller, row.personId);
  return row;
};

export const getIncident = async (db: Database, caller: Caller, id: string) => {
  const row = await getIncidentRow(db, caller, id);
  await audit(db, caller, "incident_report.read", "incident_report", id);
  return row;
};

export interface IncidentInput {
  actionTaken?: string | null;
  description: string;
  firstAiderPersonId?: string | null;
  followUpRequired?: boolean;
  kind: IncidentKind;
  occurredAt: Date;
  parentsNotifiedAt?: Date | null;
  personId: string;
  severity: IncidentSeverity;
  teamId?: string | null;
  venueId?: string | null;
}

/** Coaches and club admins write reports, about people they can see. */
export const createIncident = async (
  db: Database,
  caller: Caller,
  input: IncidentInput
) => {
  if (!isCoachOrManager(caller)) {
    throw forbidden("Only coaches and club admins write incident reports");
  }
  if (
    input.teamId !== null &&
    input.teamId !== undefined &&
    !canCoachTeam(caller, input.teamId)
  ) {
    throw forbidden("You do not coach this team");
  }
  await assertCanSee(db, caller, input.personId);
  const [row] = await guardWrite(
    async () =>
      await db
        .insert(incidentReports)
        .values({
          ...input,
          organizationId: caller.organizationId,
          reportedBy: caller.userId,
        })
        .returning(),
    { missing: "Person, team, venue or first aider" }
  );
  if (row === undefined) {
    throw new Error("Incident insert returned no row");
  }
  await audit(db, caller, "incident_report.create", "incident_report", row.id);
  return row;
};

export interface IncidentChanges {
  actionTaken?: string | null;
  followUpRequired?: boolean;
  parentsNotifiedAt?: Date | null;
}

/** The writer of a report, or a club admin, can add what was done and whether parents were told. */
export const updateIncident = async (
  db: Database,
  caller: Caller,
  id: string,
  changes: IncidentChanges
) => {
  const current = await getIncidentRow(db, caller, id);
  if (!caller.isManager && current.reportedBy !== caller.userId) {
    throw forbidden("Only the person who wrote the report can add to it");
  }
  const [row] = await db
    .update(incidentReports)
    .set(changes)
    .where(eq(incidentReports.id, id))
    .returning();
  if (row === undefined) {
    throw notFound("Incident report");
  }
  await audit(db, caller, "incident_report.update", "incident_report", id);
  return row;
};

/* ---------------------------------------------------- qualifications ----- */

export const listQualifications = async (
  db: Database,
  caller: Caller,
  personId: string
) => {
  await assertCanSee(db, caller, personId);
  return await db
    .select()
    .from(qualifications)
    .where(
      and(
        eq(qualifications.organizationId, caller.organizationId),
        eq(qualifications.personId, personId)
      )
    )
    .orderBy(asc(qualifications.expiresOn));
};

export interface QualificationInput {
  awardedBy?: string | null;
  expiresOn?: string | null;
  fileId?: string | null;
  issuedOn?: string | null;
  kind: QualificationKind;
  reference?: string | null;
  title: string;
}

export const addQualification = async (
  db: Database,
  caller: Caller,
  personId: string,
  input: QualificationInput
) => {
  await assertCanEdit(db, caller, personId);
  const [row] = await guardWrite(
    async () =>
      await db
        .insert(qualifications)
        .values({ ...input, organizationId: caller.organizationId, personId })
        .returning(),
    {
      invalid: "It cannot expire before it was issued",
      missing: "Person or file",
    }
  );
  if (row === undefined) {
    throw new Error("Qualification insert returned no row");
  }
  return row;
};

export const updateQualification = async (
  db: Database,
  caller: Caller,
  id: string,
  changes: Partial<QualificationInput>
) => {
  const [current] = await db
    .select()
    .from(qualifications)
    .where(
      and(
        eq(qualifications.organizationId, caller.organizationId),
        eq(qualifications.id, id)
      )
    );
  if (current === undefined) {
    throw notFound("Qualification");
  }
  await assertCanEdit(db, caller, current.personId);
  const [row] = await guardWrite(
    async () =>
      await db
        .update(qualifications)
        .set(changes)
        .where(eq(qualifications.id, id))
        .returning(),
    { invalid: "It cannot expire before it was issued", missing: "File" }
  );
  if (row === undefined) {
    throw notFound("Qualification");
  }
  return row;
};
