import {
  recordAuditEvent,
  safeguardingChecks,
  safeguardingConcerns,
  safeguardingNotes,
} from "@alice/database";
import type {
  ConcernSeverity,
  ConcernStatus,
  Database,
  DbsLevel,
  SafeguardingCheckKind,
  SafeguardingCheckStatus,
} from "@alice/database";
import { and, asc, desc, eq, lte } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { invalid, notFound } from "@/lib/app-error";
import { guardWrite } from "@/lib/guard-write";
import { requireSafeguardingAccess } from "@/services/access";
import type { Caller } from "@/services/access";
import { safeguardingEncryptor } from "@/services/safeguarding-encryptor";

/** Writes the audit row for a read or change. It records that it happened, never what was in it. */
const audit = async (
  db: Database,
  caller: Caller,
  action: string,
  entityType: string,
  entityId: string | null
): Promise<void> => {
  await recordAuditEvent(db, {
    action,
    actorUserId: caller.userId,
    entityId,
    entityType,
    organizationId: caller.organizationId,
  });
};

/* ------------------------------------------------------------------ checks */

export interface CheckFilters {
  expiresBefore?: string | undefined;
  kind?: SafeguardingCheckKind | undefined;
  personId?: string | undefined;
  status?: SafeguardingCheckStatus | undefined;
}

/** Club admins can see who is checked and when it runs out; only safeguarding staff change them. */
export const listChecks = async (
  db: Database,
  caller: Caller,
  filters: CheckFilters
) => {
  if (!caller.isManager) {
    requireSafeguardingAccess(caller);
  }
  const conditions: (SQL | undefined)[] = [
    eq(safeguardingChecks.organizationId, caller.organizationId),
    filters.personId === undefined
      ? undefined
      : eq(safeguardingChecks.personId, filters.personId),
    filters.kind === undefined
      ? undefined
      : eq(safeguardingChecks.kind, filters.kind),
    filters.status === undefined
      ? undefined
      : eq(safeguardingChecks.status, filters.status),
    filters.expiresBefore === undefined
      ? undefined
      : lte(safeguardingChecks.expiresOn, filters.expiresBefore),
  ];
  return await db
    .select()
    .from(safeguardingChecks)
    .where(and(...conditions))
    .orderBy(asc(safeguardingChecks.expiresOn));
};

export interface CheckInput {
  dbsLevel?: DbsLevel | null;
  dbsUpdateService?: boolean;
  expiresOn?: string | null;
  fileId?: string | null;
  issuedOn?: string | null;
  kind: SafeguardingCheckKind;
  personId: string;
  reference?: string | null;
}

export const recordCheck = async (
  db: Database,
  caller: Caller,
  input: CheckInput
) => {
  requireSafeguardingAccess(caller);
  const [row] = await guardWrite(
    async () =>
      await db
        .insert(safeguardingChecks)
        .values({ ...input, organizationId: caller.organizationId })
        .returning(),
    {
      invalid:
        "Only a DBS check has a level, and it cannot expire before it was issued",
      missing: "Person or file",
    }
  );
  if (row === undefined) {
    throw new Error("Check insert returned no row");
  }
  await audit(
    db,
    caller,
    "safeguarding_check.create",
    "safeguarding_check",
    row.id
  );
  return row;
};

export interface CheckChanges {
  expiresOn?: string | null;
  fileId?: string | null;
  issuedOn?: string | null;
  reference?: string | null;
  status?: SafeguardingCheckStatus;
}

/** Marking a check valid, rejected or revoked records who decided and when. Checks are never deleted. */
export const updateCheck = async (
  db: Database,
  caller: Caller,
  id: string,
  changes: CheckChanges
) => {
  requireSafeguardingAccess(caller);
  const decided = changes.status !== undefined && changes.status !== "pending";
  const [row] = await guardWrite(
    async () =>
      await db
        .update(safeguardingChecks)
        .set({
          ...changes,
          ...(decided
            ? { verifiedAt: new Date(), verifiedBy: caller.userId }
            : {}),
        })
        .where(
          and(
            eq(safeguardingChecks.organizationId, caller.organizationId),
            eq(safeguardingChecks.id, id)
          )
        )
        .returning(),
    {
      invalid: "It cannot expire before it was issued",
      missing: "File",
    }
  );
  if (row === undefined) {
    throw notFound("Check");
  }
  await audit(
    db,
    caller,
    "safeguarding_check.update",
    "safeguarding_check",
    id
  );
  return row;
};

/* ---------------------------------------------------------------- concerns */

export interface ConcernInput {
  details?: string | null;
  severity: ConcernSeverity;
  subjectPersonId: string;
  summary: string;
}

/**
 * Anyone in the club can raise a concern. Only the id comes back: what they
 * wrote, and everything that happens next, is for safeguarding staff.
 */
export const raiseConcern = async (
  db: Database,
  caller: Caller,
  input: ConcernInput
) => {
  const id = crypto.randomUUID();
  const details =
    input.details === undefined || input.details === null
      ? null
      : safeguardingEncryptor.encrypt(input.details, id);
  const [row] = await guardWrite(
    async () =>
      await db
        .insert(safeguardingConcerns)
        .values({
          details,
          id,
          organizationId: caller.organizationId,
          raisedBy: caller.userId,
          severity: input.severity,
          subjectPersonId: input.subjectPersonId,
          summary: input.summary,
        })
        .returning({
          id: safeguardingConcerns.id,
          openedAt: safeguardingConcerns.openedAt,
        }),
    { missing: "The person the concern is about" }
  );
  if (row === undefined) {
    throw new Error("Concern insert returned no row");
  }
  await audit(
    db,
    caller,
    "safeguarding_concern.create",
    "safeguarding_concern",
    id
  );
  return row;
};

type ConcernRow = typeof safeguardingConcerns.$inferSelect;

const readable = (row: ConcernRow): ConcernRow => ({
  ...row,
  details:
    row.details === null
      ? null
      : safeguardingEncryptor.decrypt(row.details, row.id),
});

export interface ConcernFilters {
  assignedTo?: string | undefined;
  status?: ConcernStatus | undefined;
  subjectPersonId?: string | undefined;
}

/** The list shows the short summary, never the full account. */
export const listConcerns = async (
  db: Database,
  caller: Caller,
  filters: ConcernFilters
) => {
  requireSafeguardingAccess(caller);
  const conditions: (SQL | undefined)[] = [
    eq(safeguardingConcerns.organizationId, caller.organizationId),
    filters.status === undefined
      ? undefined
      : eq(safeguardingConcerns.status, filters.status),
    filters.assignedTo === undefined
      ? undefined
      : eq(safeguardingConcerns.assignedTo, filters.assignedTo),
    filters.subjectPersonId === undefined
      ? undefined
      : eq(safeguardingConcerns.subjectPersonId, filters.subjectPersonId),
  ];
  const rows = await db
    .select()
    .from(safeguardingConcerns)
    .where(and(...conditions))
    .orderBy(desc(safeguardingConcerns.openedAt));
  await audit(
    db,
    caller,
    "safeguarding_concern.list",
    "safeguarding_concern",
    null
  );
  return rows.map((row) => ({ ...row, details: null }));
};

const getConcernRow = async (
  db: Database,
  organizationId: string,
  id: string
) => {
  const [row] = await db
    .select()
    .from(safeguardingConcerns)
    .where(
      and(
        eq(safeguardingConcerns.organizationId, organizationId),
        eq(safeguardingConcerns.id, id)
      )
    );
  if (row === undefined) {
    throw notFound("Concern");
  }
  return row;
};

/** One concern in full, with its running log. Reading it is itself recorded. */
export const getConcern = async (db: Database, caller: Caller, id: string) => {
  requireSafeguardingAccess(caller);
  const [row, notes] = await Promise.all([
    getConcernRow(db, caller.organizationId, id),
    db
      .select()
      .from(safeguardingNotes)
      .where(eq(safeguardingNotes.concernId, id))
      .orderBy(asc(safeguardingNotes.createdAt)),
  ]);
  await audit(
    db,
    caller,
    "safeguarding_concern.read",
    "safeguarding_concern",
    id
  );
  return {
    concern: readable(row),
    notes: notes.map((note) => ({
      ...note,
      body: safeguardingEncryptor.decrypt(note.body, note.id),
    })),
  };
};

export interface ConcernChanges {
  assignedTo?: string | null;
  closedReason?: string | null;
  referredTo?: string | null;
  severity?: ConcernSeverity;
  status?: ConcernStatus;
}

/**
 * Moves a concern along: assign it, change its severity, refer it, close it.
 * Closing needs a reason. A concern is never deleted; reopening clears the
 * closed time and the record of what happened stays in the notes.
 */
export const updateConcern = async (
  db: Database,
  caller: Caller,
  id: string,
  changes: ConcernChanges
) => {
  requireSafeguardingAccess(caller);
  const current = await getConcernRow(db, caller.organizationId, id);
  const status = changes.status ?? current.status;
  const reason = changes.closedReason ?? current.closedReason ?? "";
  if (status === "closed" && reason.trim().length === 0) {
    throw invalid("Closing a concern needs a reason");
  }
  if (
    status === "referred" &&
    (changes.referredTo ?? current.referredTo) === null
  ) {
    throw invalid("Say who it was referred to");
  }
  const closing = status === "closed";
  const [row] = await guardWrite(
    async () =>
      await db
        .update(safeguardingConcerns)
        .set({
          ...changes,
          closedAt: closing ? (current.closedAt ?? new Date()) : null,
          closedReason: closing ? reason : null,
          referredAt:
            changes.referredTo === undefined
              ? current.referredAt
              : (current.referredAt ?? new Date()),
        })
        .where(eq(safeguardingConcerns.id, id))
        .returning(),
    { invalid: "Those values do not fit together", missing: "User" }
  );
  if (row === undefined) {
    throw notFound("Concern");
  }
  await audit(
    db,
    caller,
    "safeguarding_concern.update",
    "safeguarding_concern",
    id
  );
  return readable({ ...row, details: row.details });
};

/** Adds to the running log. Notes cannot be edited or removed; to correct one, add another. */
export const addNote = async (
  db: Database,
  caller: Caller,
  concernId: string,
  body: string
) => {
  requireSafeguardingAccess(caller);
  await getConcernRow(db, caller.organizationId, concernId);
  const id = crypto.randomUUID();
  const [row] = await db
    .insert(safeguardingNotes)
    .values({
      authorUserId: caller.userId,
      body: safeguardingEncryptor.encrypt(body, id),
      concernId,
      id,
      organizationId: caller.organizationId,
    })
    .returning();
  if (row === undefined) {
    throw new Error("Note insert returned no row");
  }
  await audit(
    db,
    caller,
    "safeguarding_note.create",
    "safeguarding_concern",
    concernId
  );
  return { ...row, body };
};
