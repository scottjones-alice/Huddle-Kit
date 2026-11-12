import { registrations } from "@alice/database";
import type { Database, RegistrationStatus } from "@alice/database";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { forbidden, invalid, notFound } from "@/lib/app-error";
import { guardWrite } from "@/lib/guard-write";
import type { Caller } from "@/services/access";
import { editablePersonIds } from "@/services/people";

const today = (): string => new Date().toISOString().slice(0, 10);

export interface RegistrationFilters {
  limit: number;
  offset: number;
  personId?: string | undefined;
  seasonId?: string | undefined;
  status?: RegistrationStatus | undefined;
  teamId?: string | undefined;
}

/** Club admins see every registration. Everyone else sees their own and their children's. */
export const listRegistrations = async (
  db: Database,
  caller: Caller,
  filters: RegistrationFilters
) => {
  const editable = await editablePersonIds(db, caller);
  if (editable !== null && editable.length === 0) {
    return [];
  }
  const conditions: (SQL | undefined)[] = [
    eq(registrations.organizationId, caller.organizationId),
    editable === null ? undefined : inArray(registrations.personId, editable),
    filters.personId === undefined
      ? undefined
      : eq(registrations.personId, filters.personId),
    filters.seasonId === undefined
      ? undefined
      : eq(registrations.seasonId, filters.seasonId),
    filters.status === undefined
      ? undefined
      : eq(registrations.status, filters.status),
    filters.teamId === undefined
      ? undefined
      : eq(registrations.teamId, filters.teamId),
  ];
  return await db
    .select()
    .from(registrations)
    .where(and(...conditions))
    .orderBy(desc(registrations.createdAt))
    .limit(filters.limit)
    .offset(filters.offset);
};

export interface RegistrationInput {
  notes?: string | null;
  personId: string;
  seasonId: string;
  teamId?: string | null;
}

/**
 * Asks to join for a season. You can register yourself and your children and
 * it waits as "pending" for a club admin; admins can register anyone and the
 * registration starts as "active".
 */
export const register = async (
  db: Database,
  caller: Caller,
  input: RegistrationInput
) => {
  const editable = await editablePersonIds(db, caller);
  if (editable !== null && !editable.includes(input.personId)) {
    throw forbidden("You can only register yourself and your children");
  }
  if (
    input.teamId !== null &&
    input.teamId !== undefined &&
    !caller.isManager
  ) {
    throw forbidden("Only a club admin can place someone in a team");
  }
  const [row] = await guardWrite(
    async () =>
      await db
        .insert(registrations)
        .values({
          ...input,
          organizationId: caller.organizationId,
          registeredOn: today(),
          status: caller.isManager ? "active" : "pending",
        })
        .returning(),
    {
      missing: "Person, season or team",
      taken: "This person is already registered for that season",
    }
  );
  if (row === undefined) {
    throw new Error("Registration insert returned no row");
  }
  return row;
};

/** Withdrawn registrations carry the date they left; every other status has none. */
const withdrawnOnFor = (
  current: string | null,
  status: RegistrationStatus | undefined
): string | null => {
  if (status === undefined) {
    return current;
  }
  return status === "withdrawn" ? (current ?? today()) : null;
};

export interface RegistrationChanges {
  notes?: string | null;
  status?: RegistrationStatus;
  teamId?: string | null;
}

/**
 * Admins accept, reject, place or withdraw. The registered person (or their
 * parent) can only withdraw. A withdrawn registration stays as history.
 */
export const updateRegistration = async (
  db: Database,
  caller: Caller,
  id: string,
  changes: RegistrationChanges
) => {
  const [current] = await db
    .select()
    .from(registrations)
    .where(
      and(
        eq(registrations.organizationId, caller.organizationId),
        eq(registrations.id, id)
      )
    );
  if (current === undefined) {
    throw notFound("Registration");
  }
  if (!caller.isManager) {
    const editable = await editablePersonIds(db, caller);
    if (editable !== null && !editable.includes(current.personId)) {
      throw notFound("Registration");
    }
    const onlyWithdraw =
      changes.status === "withdrawn" &&
      changes.teamId === undefined &&
      changes.notes === undefined;
    if (!onlyWithdraw) {
      throw forbidden("You can only withdraw a registration");
    }
  }
  if (changes.status === "pending") {
    throw invalid("A registration cannot go back to pending");
  }
  const withdrawnOn = withdrawnOnFor(current.withdrawnOn, changes.status);
  const [row] = await guardWrite(
    async () =>
      await db
        .update(registrations)
        .set({ ...changes, withdrawnOn })
        .where(eq(registrations.id, id))
        .returning(),
    { missing: "Team" }
  );
  if (row === undefined) {
    throw notFound("Registration");
  }
  return row;
};
