import {
  addresses,
  people,
  personRelationships,
  playerProfiles,
  teamMemberships,
} from "@alice/database";
import type { Database } from "@alice/database";
import { and, asc, eq, gt, ilike, inArray, isNull, or } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { forbidden, invalid, notFound } from "@/lib/app-error";
import type { Caller } from "@/services/access";
import type { AddressInput } from "@/services/venues";

const LIKE_SPECIAL = /[%_\\]/gu;

/** The person record that belongs to the caller's login in this club, if they have one. */
export const ownPersonId = async (
  db: Database,
  caller: Caller
): Promise<string | null> => {
  const [row] = await db
    .select({ id: people.id })
    .from(people)
    .where(
      and(
        eq(people.organizationId, caller.organizationId),
        eq(people.userId, caller.userId)
      )
    );
  return row?.id ?? null;
};

/** Children the caller has parental responsibility for. */
export const childIdsOf = async (
  db: Database,
  caller: Caller,
  parentPersonId: string | null
): Promise<string[]> => {
  if (parentPersonId === null) {
    return [];
  }
  const rows = await db
    .select({ id: personRelationships.personId })
    .from(personRelationships)
    .where(
      and(
        eq(personRelationships.organizationId, caller.organizationId),
        eq(personRelationships.relatedPersonId, parentPersonId),
        eq(personRelationships.hasParentalResponsibility, true)
      )
    );
  return rows.map((row) => row.id);
};

/** Today as YYYY-MM-DD. */
const today = (): string => new Date().toISOString().slice(0, 10);

/** People on the teams the caller coaches (current memberships only). */
const coachedPersonIds = async (
  db: Database,
  caller: Caller
): Promise<string[]> => {
  const teamFilter: SQL | undefined = caller.clubWideCoaching
    ? undefined
    : inArray(teamMemberships.teamId, [...caller.scopedTeamIds]);
  if (!caller.clubWideCoaching && caller.scopedTeamIds.size === 0) {
    return [];
  }
  const rows = await db
    .select({ personId: teamMemberships.personId })
    .from(teamMemberships)
    .where(
      and(
        eq(teamMemberships.organizationId, caller.organizationId),
        teamFilter,
        or(isNull(teamMemberships.endsOn), gt(teamMemberships.endsOn, today()))
      )
    );
  return rows.map((row) => row.personId);
};

/**
 * Which people the caller may see. `null` means everyone (a manager). Otherwise
 * a list: the caller, their own children, and the people on teams they coach.
 */
export const visiblePersonIds = async (
  db: Database,
  caller: Caller
): Promise<string[] | null> => {
  if (caller.isManager) {
    return null;
  }
  const own = await ownPersonId(db, caller);
  const [children, coached] = await Promise.all([
    childIdsOf(db, caller, own),
    coachedPersonIds(db, caller),
  ]);
  return [
    ...new Set([...(own === null ? [] : [own]), ...children, ...coached]),
  ];
};

/** The caller's own record and their children: the people they may also edit. */
export const editablePersonIds = async (
  db: Database,
  caller: Caller
): Promise<string[] | null> => {
  if (caller.isManager) {
    return null;
  }
  const own = await ownPersonId(db, caller);
  const children = await childIdsOf(db, caller, own);
  return [...(own === null ? [] : [own]), ...children];
};

export const assertCanSee = async (
  db: Database,
  caller: Caller,
  personId: string
): Promise<void> => {
  const visible = await visiblePersonIds(db, caller);
  if (visible !== null && !visible.includes(personId)) {
    throw notFound("Person");
  }
};

export const assertCanEdit = async (
  db: Database,
  caller: Caller,
  personId: string
): Promise<void> => {
  const editable = await editablePersonIds(db, caller);
  if (editable !== null && !editable.includes(personId)) {
    throw forbidden("You can only change your own details and your children's");
  }
};

export interface ListPeopleOptions {
  includeArchived: boolean;
  limit: number;
  offset: number;
  search?: string | undefined;
}

export const listPeople = async (
  db: Database,
  caller: Caller,
  options: ListPeopleOptions
) => {
  const visible = await visiblePersonIds(db, caller);
  if (visible !== null && visible.length === 0) {
    return [];
  }
  const term = options.search?.trim();
  const search =
    term === undefined || term === ""
      ? undefined
      : or(
          ilike(people.firstName, `%${term.replaceAll(LIKE_SPECIAL, "\\$&")}%`),
          ilike(people.lastName, `%${term.replaceAll(LIKE_SPECIAL, "\\$&")}%`),
          ilike(people.email, `%${term.replaceAll(LIKE_SPECIAL, "\\$&")}%`)
        );
  return await db
    .select()
    .from(people)
    .where(
      and(
        eq(people.organizationId, caller.organizationId),
        visible === null ? undefined : inArray(people.id, visible),
        options.includeArchived ? undefined : eq(people.isActive, true),
        search
      )
    )
    .orderBy(asc(people.lastName), asc(people.firstName))
    .limit(options.limit)
    .offset(options.offset);
};

/** A person with their address, family links, player profile and team history. */
export const getPersonDetail = async (
  db: Database,
  caller: Caller,
  personId: string
) => {
  await assertCanSee(db, caller, personId);
  const [person] = await db
    .select()
    .from(people)
    .where(
      and(
        eq(people.organizationId, caller.organizationId),
        eq(people.id, personId)
      )
    );
  if (person === undefined) {
    throw notFound("Person");
  }
  const [address, relationships, profile, memberships] = await Promise.all([
    person.addressId === null
      ? Promise.resolve([])
      : db.select().from(addresses).where(eq(addresses.id, person.addressId)),
    db
      .select()
      .from(personRelationships)
      .where(
        and(
          eq(personRelationships.organizationId, caller.organizationId),
          or(
            eq(personRelationships.personId, personId),
            eq(personRelationships.relatedPersonId, personId)
          )
        )
      ),
    db
      .select()
      .from(playerProfiles)
      .where(eq(playerProfiles.personId, personId)),
    db
      .select()
      .from(teamMemberships)
      .where(eq(teamMemberships.personId, personId)),
  ]);
  return {
    address: address[0] ?? null,
    memberships,
    person,
    playerProfile: profile[0] ?? null,
    relationships,
  };
};

export interface PersonInput {
  address?: AddressInput | null;
  dateOfBirth?: string | null;
  email?: string | null;
  firstName: string;
  lastName: string;
  phone?: string | null;
  preferredName?: string | null;
}

export type PersonChanges = Partial<PersonInput> & { isActive?: boolean };

const addressRow = (address: AddressInput) => ({
  city: address.city,
  countryCode: address.countryCode,
  line1: address.line1,
  line2: address.line2 ?? null,
  postalCode: address.postalCode ?? null,
  region: address.region ?? null,
});

export const createPerson = async (
  db: Database,
  organizationId: string,
  input: PersonInput
) =>
  await db.transaction(async (tx) => {
    let addressId: string | null = null;
    if (input.address !== undefined && input.address !== null) {
      const [created] = await tx
        .insert(addresses)
        .values({ ...addressRow(input.address), organizationId })
        .returning({ id: addresses.id });
      addressId = created?.id ?? null;
    }
    const { address: _address, ...rest } = input;
    const [person] = await tx
      .insert(people)
      .values({ ...rest, addressId, organizationId })
      .returning();
    if (person === undefined) {
      throw new Error("Person insert returned no row");
    }
    return person;
  });

export const updatePerson = async (
  db: Database,
  caller: Caller,
  personId: string,
  changes: PersonChanges
) => {
  await assertCanEdit(db, caller, personId);
  if (changes.isActive !== undefined && !caller.isManager) {
    throw forbidden("Only a club admin can archive or restore a person");
  }
  return await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(people)
      .where(
        and(
          eq(people.organizationId, caller.organizationId),
          eq(people.id, personId)
        )
      );
    if (current === undefined) {
      throw notFound("Person");
    }
    const { address, ...rest } = changes;
    let { addressId } = current;
    if (address !== undefined && address !== null) {
      if (addressId === null) {
        const [created] = await tx
          .insert(addresses)
          .values({
            ...addressRow(address),
            organizationId: caller.organizationId,
          })
          .returning({ id: addresses.id });
        addressId = created?.id ?? null;
      } else {
        await tx
          .update(addresses)
          .set(addressRow(address))
          .where(eq(addresses.id, addressId));
      }
    }
    const [updated] = await tx
      .update(people)
      .set({ ...rest, addressId })
      .where(eq(people.id, personId))
      .returning();
    if (updated === undefined) {
      throw notFound("Person");
    }
    return updated;
  });
};

export interface RelationshipInput {
  canCollect?: boolean;
  hasParentalResponsibility?: boolean;
  isEmergencyContact?: boolean;
  /** The adult. */
  relatedPersonId: string;
  relationship: "parent" | "guardian" | "carer" | "grandparent" | "other";
}

/** Links an adult to a child (or any person). Both must be in the club. */
export const linkPeople = async (
  db: Database,
  organizationId: string,
  personId: string,
  input: RelationshipInput
) => {
  if (personId === input.relatedPersonId) {
    throw invalid("A person cannot be linked to themselves");
  }
  const found = await db
    .select({ id: people.id })
    .from(people)
    .where(
      and(
        eq(people.organizationId, organizationId),
        inArray(people.id, [personId, input.relatedPersonId])
      )
    );
  if (found.length !== 2) {
    throw notFound("Person");
  }
  const [row] = await db
    .insert(personRelationships)
    .values({ ...input, organizationId, personId })
    .onConflictDoUpdate({
      set: {
        canCollect: input.canCollect ?? false,
        hasParentalResponsibility: input.hasParentalResponsibility ?? false,
        isEmergencyContact: input.isEmergencyContact ?? false,
      },
      target: [
        personRelationships.personId,
        personRelationships.relatedPersonId,
        personRelationships.relationship,
      ],
    })
    .returning();
  if (row === undefined) {
    throw new Error("Relationship insert returned no row");
  }
  return row;
};
