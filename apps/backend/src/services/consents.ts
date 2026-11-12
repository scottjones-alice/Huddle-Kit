import { consentDocuments, consents } from "@alice/database";
import type { ConsentType, Database } from "@alice/database";
import { and, asc, desc, eq, isNull, max } from "drizzle-orm";

import { conflict, forbidden, invalid, notFound } from "@/lib/app-error";
import { guardWrite } from "@/lib/guard-write";
import { requireManager } from "@/services/access";
import type { Caller } from "@/services/access";
import {
  assertCanSee,
  editablePersonIds,
  ownPersonId,
} from "@/services/people";

export const listDocuments = async (
  db: Database,
  organizationId: string,
  includeRetired: boolean
) =>
  await db
    .select()
    .from(consentDocuments)
    .where(
      and(
        eq(consentDocuments.organizationId, organizationId),
        includeRetired ? undefined : isNull(consentDocuments.retiredAt)
      )
    )
    .orderBy(asc(consentDocuments.type), desc(consentDocuments.version));

/** Publishes the next version of a consent form. Old wording is never edited. */
export const publishDocument = async (
  db: Database,
  caller: Caller,
  input: { body: string; title: string; type: ConsentType }
) => {
  requireManager(caller);
  return await db.transaction(async (tx) => {
    const [latest] = await tx
      .select({ version: max(consentDocuments.version) })
      .from(consentDocuments)
      .where(
        and(
          eq(consentDocuments.organizationId, caller.organizationId),
          eq(consentDocuments.type, input.type)
        )
      );
    const [row] = await guardWrite(
      async () =>
        await tx
          .insert(consentDocuments)
          .values({
            ...input,
            organizationId: caller.organizationId,
            version: (latest?.version ?? 0) + 1,
          })
          .returning(),
      {
        invalid: "The title and wording cannot be empty",
        taken: "Another admin just published a version. Try again",
      }
    );
    if (row === undefined) {
      throw new Error("Consent document insert returned no row");
    }
    return row;
  });
};

/** Stops offering a version. Consents already given against it stay valid. */
export const retireDocument = async (
  db: Database,
  caller: Caller,
  id: string
) => {
  requireManager(caller);
  const [row] = await db
    .update(consentDocuments)
    .set({ retiredAt: new Date() })
    .where(
      and(
        eq(consentDocuments.organizationId, caller.organizationId),
        eq(consentDocuments.id, id),
        isNull(consentDocuments.retiredAt)
      )
    )
    .returning();
  if (row === undefined) {
    throw notFound("Consent form");
  }
  return row;
};

/** Everything a person has agreed to, current and withdrawn. Who can see the person decides who can see this. */
export const listConsents = async (
  db: Database,
  caller: Caller,
  personId: string
) => {
  await assertCanSee(db, caller, personId);
  return await db
    .select()
    .from(consents)
    .where(
      and(
        eq(consents.organizationId, caller.organizationId),
        eq(consents.personId, personId)
      )
    )
    .orderBy(desc(consents.grantedAt));
};

export interface GrantInput {
  documentId?: string | null;
  expiresAt?: Date | null;
  notes?: string | null;
  type: ConsentType;
}

/**
 * Records that someone agreed. You can agree for yourself and your children;
 * when a parent agrees for a child, the parent is recorded as the one who
 * agreed. Agreeing twice to the same thing is refused: withdraw first.
 */
export const grantConsent = async (
  db: Database,
  caller: Caller,
  personId: string,
  input: GrantInput
) => {
  const editable = await editablePersonIds(db, caller);
  if (editable !== null && !editable.includes(personId)) {
    throw forbidden("You can only give consent for yourself and your children");
  }
  const own = await ownPersonId(db, caller);
  const [row] = await guardWrite(
    async () =>
      await db
        .insert(consents)
        .values({
          ...input,
          grantedAt: new Date(),
          grantedByPersonId: own === null || own === personId ? null : own,
          organizationId: caller.organizationId,
          personId,
        })
        .returning(),
    {
      invalid: "The expiry must be after today",
      missing: "Person or consent form",
      taken:
        "Consent is already given for this. Withdraw it first to change it",
    }
  );
  if (row === undefined) {
    throw new Error("Consent insert returned no row");
  }
  return row;
};

/** Takes consent back. The record stays, with when it stopped. */
export const withdrawConsent = async (
  db: Database,
  caller: Caller,
  id: string
) => {
  const [current] = await db
    .select()
    .from(consents)
    .where(
      and(
        eq(consents.organizationId, caller.organizationId),
        eq(consents.id, id)
      )
    );
  if (current === undefined) {
    throw notFound("Consent");
  }
  const editable = await editablePersonIds(db, caller);
  if (editable !== null && !editable.includes(current.personId)) {
    throw notFound("Consent");
  }
  if (current.withdrawnAt !== null) {
    throw conflict("This consent was already withdrawn");
  }
  const [row] = await guardWrite(
    async () =>
      await db
        .update(consents)
        .set({ withdrawnAt: new Date() })
        .where(eq(consents.id, id))
        .returning(),
    { invalid: "It cannot be withdrawn before it was given" }
  );
  if (row === undefined) {
    throw invalid("The consent could not be withdrawn");
  }
  return row;
};
