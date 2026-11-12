import {
  AVAILABILITY_SLOTS,
  JOINING_ROLES,
  PAYERS,
  PAYMENT_METHODS_PREFERRED,
  PICKUP_RULES,
  SOCIAL_PLATFORMS,
  addresses,
  allergies,
  consents,
  medicalRecords,
  memberBillingPreferences,
  memberJoiningRoles,
  people,
  personAvailability,
  personDemographics,
  personKit,
  personRelationships,
  personSocialLinks,
  playerProfiles,
  qualifications,
  safeguardingChecks,
  users,
} from "@alice/database";
import type { Database } from "@alice/database";
import { z } from "@hono/zod-openapi";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";

const MAX_TEXT = 200;
const MAX_LONG = 2000;
const MAX_ITEMS = 20;
const text = () => z.string().trim().min(1).max(MAX_TEXT);
const optionalText = () => z.string().trim().max(MAX_TEXT).nullish();
const longText = () => z.string().trim().max(MAX_LONG).nullish();

const addressSchema = z.object({
  city: text(),
  countryCode: z.string().regex(/^[A-Z]{2}$/u),
  line1: text(),
  line2: optionalText(),
  postalCode: optionalText(),
  region: optionalText(),
});

const consentFlags = z.object({
  dataSharing: z.boolean().optional(),
  medicalTreatment: z.boolean().optional(),
  photoVideo: z.boolean().optional(),
  socialMedia: z.boolean().optional(),
  travel: z.boolean().optional(),
});
export type ConsentFlags = z.infer<typeof consentFlags>;

const kitSchema = z.object({
  pickupRule: z.enum(PICKUP_RULES).nullish(),
  shirtName: optionalText(),
  shirtSize: optionalText(),
  shortsSize: optionalText(),
  squadNumber: z.number().int().min(1).max(99).nullish(),
});

const allergySchema = z.object({
  allergen: text(),
  reaction: optionalText(),
  severity: z.enum(["mild", "moderate", "severe", "life_threatening"]),
  treatment: optionalText(),
});

const medicalSchema = z.object({
  allergies: z.array(allergySchema).max(MAX_ITEMS).default([]),
  conditions: longText(),
  medication: longText(),
});

const otherGuardianSchema = z.object({
  email: z.email().nullish(),
  firstName: text(),
  hasParentalResponsibility: z.boolean(),
  isEmergencyContact: z.boolean(),
  lastName: text(),
  phone: optionalText(),
  relationship: z.enum(["parent", "guardian", "carer", "grandparent", "other"]),
});

const childSchema = z.object({
  consents: consentFlags.optional(),
  dateOfBirth: z.iso.date(),
  firstName: text(),
  id: z.uuid().optional(),
  kit: kitSchema.optional(),
  lastName: text(),
  medical: medicalSchema.optional(),
  otherGuardian: otherGuardianSchema.nullish(),
  position: optionalText(),
});
export type ChildInput = z.infer<typeof childSchema>;

const contactSchema = z.object({
  canCollect: z.boolean().default(false),
  firstName: text(),
  lastName: text(),
  phone: text(),
  relationship: z.enum(["parent", "guardian", "carer", "grandparent", "other"]),
});

const dateOrNull = () => z.iso.date().nullish();

/** The request body for each people-wizard step, keyed by the step it saves. */
export const memberStepSchemas = {
  address: addressSchema,
  availability: z.object({
    notes: longText(),
    slots: z
      .array(
        z.object({
          dayOfWeek: z.number().int().min(1).max(7),
          slot: z.enum(AVAILABILITY_SLOTS),
        })
      )
      .max(7 * AVAILABILITY_SLOTS.length),
  }),
  billing: z.object({
    billingEmail: z.email().nullish(),
    method: z.enum(PAYMENT_METHODS_PREFERRED).nullish(),
    payer: z.enum(PAYERS).nullish(),
    secondPayerEmail: z.email().nullish(),
    secondPayerName: optionalText(),
    sendReminders: z.boolean().default(true),
  }),
  children: z.object({
    // Children to archive (hidden, never deleted). Their records are kept.
    archiveChildIds: z.array(z.uuid()).max(MAX_ITEMS).default([]),
    children: z.array(childSchema).max(MAX_ITEMS).default([]),
  }),
  dbs: z.object({
    coaching: z
      .object({
        awardedBy: optionalText(),
        expiresOn: dateOrNull(),
        issuedOn: dateOrNull(),
        title: text(),
      })
      .nullish(),
    dbs: z
      .object({
        expiresOn: dateOrNull(),
        fileId: z.uuid().nullish(),
        issuedOn: dateOrNull(),
        level: z.enum([
          "basic",
          "standard",
          "enhanced",
          "enhanced_barred_list",
        ]),
        onUpdateService: z.boolean(),
        reference: optionalText(),
      })
      .nullish(),
    firstAidExpiresOn: dateOrNull(),
    safeguardingTrainingExpiresOn: dateOrNull(),
  }),
  details: z.object({
    additionalNeeds: longText(),
    dateOfBirth: z.iso.date().nullish(),
    email: z.email().nullish(),
    ethnicity: optionalText(),
    firstName: text(),
    gender: optionalText(),
    kit: kitSchema.optional(),
    lastName: text(),
    phone: optionalText(),
    position: optionalText(),
    preferredName: optionalText(),
    religion: optionalText(),
  }),
  permissions: z.object({
    // Consent for the signed-in person and, by id, for each of their children.
    children: z
      .array(z.object({ consents: consentFlags, id: z.uuid() }))
      .max(MAX_ITEMS)
      .default([]),
    self: consentFlags.optional(),
  }),
  role: z.object({ role: z.enum(JOINING_ROLES) }),
  safety: z.object({
    contacts: z.array(contactSchema).max(MAX_ITEMS).default([]),
    emergencyTreatment: z.boolean().optional(),
    medical: medicalSchema.optional(),
  }),
  social: z.object({
    consents: consentFlags,
    // The person's own handles, one per platform. Sending the list replaces it.
    links: z
      .array(
        z.object({
          handle: z.string().trim().min(1).max(MAX_TEXT),
          platform: z.enum(SOCIAL_PLATFORMS),
        })
      )
      .max(SOCIAL_PLATFORMS.length)
      .default([]),
  }),
} as const;

export type MemberStepName = keyof typeof memberStepSchemas;

export const memberStepInputSchema = z.discriminatedUnion("step", [
  z.object({ data: memberStepSchemas.address, step: z.literal("address") }),
  z.object({
    data: memberStepSchemas.availability,
    step: z.literal("availability"),
  }),
  z.object({ data: memberStepSchemas.billing, step: z.literal("billing") }),
  z.object({ data: memberStepSchemas.children, step: z.literal("children") }),
  z.object({ data: memberStepSchemas.dbs, step: z.literal("dbs") }),
  z.object({ data: memberStepSchemas.details, step: z.literal("details") }),
  z.object({
    data: memberStepSchemas.permissions,
    step: z.literal("permissions"),
  }),
  z.object({ data: memberStepSchemas.role, step: z.literal("role") }),
  z.object({ data: memberStepSchemas.safety, step: z.literal("safety") }),
  z.object({ data: memberStepSchemas.social, step: z.literal("social") }),
]);
export type MemberStepInput = z.infer<typeof memberStepInputSchema>;

/** Thrown when a child id in the request is not one of the caller's own children. */
export class NotYourChildError extends Error {
  constructor() {
    super("That child is not linked to your account");
    this.name = "NotYourChildError";
  }
}

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

interface Caller {
  organizationId: string;
  userId: string;
}

const splitName = (name: string) => {
  const [first = name, ...rest] = name.trim().split(/\s+/u);
  return { firstName: first, lastName: rest.join(" ") || first };
};

/** The caller's own person row in this club, created from their account on first use. */
const ensureOwnPerson = async (tx: Tx, { organizationId, userId }: Caller) => {
  const [existing] = await tx
    .select({ id: people.id })
    .from(people)
    .where(
      and(eq(people.organizationId, organizationId), eq(people.userId, userId))
    );
  if (existing !== undefined) {
    return existing.id;
  }
  const [user] = await tx
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, userId));
  if (user === undefined) {
    throw new Error("Signed-in user not found");
  }
  const [created] = await tx
    .insert(people)
    .values({
      email: user.email,
      organizationId,
      userId,
      ...splitName(user.name),
    })
    .returning({ id: people.id });
  if (created === undefined) {
    throw new Error("Person was not created");
  }
  return created.id;
};

/** Children of the caller: people whose relationship row names the caller as the adult. */
const ownChildIds = async (
  tx: Tx,
  organizationId: string,
  parentId: string
) => {
  const rows = await tx
    .select({ id: personRelationships.personId })
    .from(personRelationships)
    .where(
      and(
        eq(personRelationships.organizationId, organizationId),
        eq(personRelationships.relatedPersonId, parentId),
        eq(personRelationships.hasParentalResponsibility, true)
      )
    );
  return new Set(rows.map((row) => row.id));
};

const upsertKit = async (
  tx: Tx,
  organizationId: string,
  personId: string,
  kit: z.infer<typeof kitSchema>
) => {
  const values = {
    pickupRule: kit.pickupRule ?? null,
    shirtName: kit.shirtName ?? null,
    shirtSize: kit.shirtSize ?? null,
    shortsSize: kit.shortsSize ?? null,
    squadNumber: kit.squadNumber ?? null,
  };
  await tx
    .insert(personKit)
    .values({ organizationId, personId, ...values })
    .onConflictDoUpdate({ set: values, target: personKit.personId });
};

/** Today as YYYY-MM-DD, for ending a medical record without deleting it. */
const today = () => new Date().toISOString().slice(0, 10);

const MEDICAL_KINDS = [
  { field: "conditions", kind: "condition", name: "Medical conditions" },
  { field: "medication", kind: "medication", name: "Medication" },
] as const;

/**
 * Keeps medical history. A record is updated in place, or ended (`endedOn`)
 * when the text is cleared; allergies are archived, never deleted.
 */
const saveMedical = async (
  tx: Tx,
  organizationId: string,
  personId: string,
  medical: z.infer<typeof medicalSchema>
) => {
  await Promise.all(
    MEDICAL_KINDS.map(async ({ field, kind, name }) => {
      const details = medical[field];
      const [current] = await tx
        .select({ id: medicalRecords.id })
        .from(medicalRecords)
        .where(
          and(
            eq(medicalRecords.personId, personId),
            eq(medicalRecords.kind, kind),
            isNull(medicalRecords.endedOn)
          )
        );
      const hasText =
        details !== null && details !== undefined && details !== "";
      if (hasText && current === undefined) {
        await tx.insert(medicalRecords).values({
          details,
          isEmergencyRelevant: true,
          kind,
          name,
          organizationId,
          personId,
        });
      } else if (hasText && current !== undefined) {
        await tx
          .update(medicalRecords)
          .set({ details })
          .where(eq(medicalRecords.id, current.id));
      } else if (!hasText && current !== undefined) {
        await tx
          .update(medicalRecords)
          .set({ endedOn: today() })
          .where(eq(medicalRecords.id, current.id));
      }
    })
  );

  const existing = await tx
    .select({ allergen: allergies.allergen, id: allergies.id })
    .from(allergies)
    .where(eq(allergies.personId, personId));
  const byName = new Map(existing.map((row) => [row.allergen, row.id]));
  const keep = new Set(medical.allergies.map((allergy) => allergy.allergen));
  const now = new Date();
  const archiveAllergy = async (id: string) => {
    await tx
      .update(allergies)
      .set({ archivedAt: now })
      .where(and(eq(allergies.id, id), isNull(allergies.archivedAt)));
  };
  await Promise.all([
    ...medical.allergies.map(async (allergy) => {
      const id = byName.get(allergy.allergen);
      if (id === undefined) {
        await tx
          .insert(allergies)
          .values({ ...allergy, organizationId, personId });
        return;
      }
      await tx
        .update(allergies)
        .set({
          archivedAt: null,
          reaction: allergy.reaction ?? null,
          severity: allergy.severity,
          treatment: allergy.treatment ?? null,
        })
        .where(eq(allergies.id, id));
    }),
    ...existing.flatMap((row) =>
      keep.has(row.allergen) ? [] : [archiveAllergy(row.id)]
    ),
  ]);
};

const CONSENT_FLAGS = [
  ["dataSharing", "data_sharing"],
  ["medicalTreatment", "medical_treatment"],
  ["photoVideo", "photo_video"],
  ["socialMedia", "social_media"],
  ["travel", "travel"],
] as const;

/** Grants or withdraws each consent that is present in `flags`. Absent ones are left alone. */
const applyConsents = async (
  tx: Tx,
  organizationId: string,
  personId: string,
  grantedByPersonId: string,
  flags: ConsentFlags
) => {
  const now = new Date();
  await Promise.all(
    CONSENT_FLAGS.map(async ([flag, type]) => {
      const granted = flags[flag];
      if (granted === undefined) {
        return;
      }
      const [active] = await tx
        .select({ id: consents.id })
        .from(consents)
        .where(
          and(
            eq(consents.personId, personId),
            eq(consents.type, type),
            isNull(consents.withdrawnAt)
          )
        );
      if (granted && active === undefined) {
        await tx.insert(consents).values({
          grantedAt: now,
          grantedByPersonId,
          organizationId,
          personId,
          type,
        });
      } else if (!granted && active !== undefined) {
        await tx
          .update(consents)
          .set({ withdrawnAt: now })
          .where(eq(consents.id, active.id));
      }
    })
  );
};

const saveDetails = async (
  tx: Tx,
  caller: Caller,
  data: z.infer<typeof memberStepSchemas.details>
) => {
  const personId = await ensureOwnPerson(tx, caller);
  const { organizationId } = caller;
  await tx
    .update(people)
    .set({
      dateOfBirth: data.dateOfBirth ?? null,
      email: data.email ?? null,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? null,
      preferredName: data.preferredName ?? null,
    })
    .where(eq(people.id, personId));
  const demographics = {
    additionalNeeds: data.additionalNeeds ?? null,
    ethnicity: data.ethnicity ?? null,
    gender: data.gender ?? null,
    religion: data.religion ?? null,
  };
  await tx
    .insert(personDemographics)
    .values({ organizationId, personId, ...demographics })
    .onConflictDoUpdate({
      set: demographics,
      target: personDemographics.personId,
    });
  if (data.kit !== undefined) {
    await upsertKit(tx, organizationId, personId, data.kit);
  }
  if (data.position !== undefined && data.position !== null) {
    await tx
      .insert(playerProfiles)
      .values({ organizationId, personId, primaryPosition: data.position })
      .onConflictDoUpdate({
        set: { primaryPosition: data.position },
        target: playerProfiles.personId,
      });
  }
};

const saveAddress = async (
  tx: Tx,
  caller: Caller,
  data: z.infer<typeof memberStepSchemas.address>
) => {
  const personId = await ensureOwnPerson(tx, caller);
  const values = {
    city: data.city,
    countryCode: data.countryCode,
    line1: data.line1,
    line2: data.line2 ?? null,
    postalCode: data.postalCode ?? null,
    region: data.region ?? null,
  };
  const [person] = await tx
    .select({ addressId: people.addressId })
    .from(people)
    .where(eq(people.id, personId));
  if (person?.addressId === null || person?.addressId === undefined) {
    const [created] = await tx
      .insert(addresses)
      .values({ organizationId: caller.organizationId, ...values })
      .returning({ id: addresses.id });
    if (created === undefined) {
      throw new Error("Address was not created");
    }
    await tx
      .update(people)
      .set({ addressId: created.id })
      .where(eq(people.id, personId));
    return;
  }
  await tx
    .update(addresses)
    .set(values)
    .where(eq(addresses.id, person.addressId));
};

const saveSafety = async (
  tx: Tx,
  caller: Caller,
  data: z.infer<typeof memberStepSchemas.safety>
) => {
  const personId = await ensureOwnPerson(tx, caller);
  const { organizationId } = caller;
  if (data.medical !== undefined) {
    await saveMedical(tx, organizationId, personId, data.medical);
  }
  if (data.emergencyTreatment !== undefined) {
    await applyConsents(tx, organizationId, personId, personId, {
      medicalTreatment: data.emergencyTreatment,
    });
  }
  // The contacts replace the ones set up earlier. Old contacts are archived
  // (`isActive` false), never deleted, and their links stay as history.
  const old = await tx
    .select({ related: personRelationships.relatedPersonId })
    .from(personRelationships)
    .innerJoin(people, eq(people.id, personRelationships.relatedPersonId))
    .where(
      and(
        eq(personRelationships.personId, personId),
        eq(personRelationships.isEmergencyContact, true),
        eq(personRelationships.hasParentalResponsibility, false),
        eq(people.isActive, true),
        isNull(people.userId)
      )
    );
  if (old.length > 0) {
    await tx
      .update(people)
      .set({ isActive: false })
      .where(
        and(
          inArray(
            people.id,
            old.map((row) => row.related)
          ),
          eq(people.organizationId, organizationId)
        )
      );
  }
  await Promise.all(
    data.contacts.map(async (contact) => {
      const [created] = await tx
        .insert(people)
        .values({
          firstName: contact.firstName,
          lastName: contact.lastName,
          organizationId,
          phone: contact.phone,
        })
        .returning({ id: people.id });
      if (created === undefined) {
        throw new Error("Contact was not created");
      }
      await tx.insert(personRelationships).values({
        canCollect: contact.canCollect,
        hasParentalResponsibility: false,
        isEmergencyContact: true,
        organizationId,
        personId,
        relatedPersonId: created.id,
        relationship: contact.relationship,
      });
    })
  );
};

type CheckKind = "dbs" | "first_aid" | "safeguarding_training";

interface CheckValues {
  dbsLevel?: "basic" | "standard" | "enhanced" | "enhanced_barred_list";
  dbsUpdateService?: boolean;
  expiresOn: string | null;
  fileId?: string | null;
  issuedOn?: string | null;
  reference?: string | null;
}

/**
 * Self-reported checks are history: the latest one of each kind is updated in
 * place (and goes back to "pending" for an admin to re-verify), or a first one
 * is added. Clearing a field never removes a check.
 */
const upsertCheck = async (
  tx: Tx,
  caller: Caller,
  personId: string,
  kind: CheckKind,
  values: CheckValues
) => {
  const [current] = await tx
    .select({ id: safeguardingChecks.id })
    .from(safeguardingChecks)
    .where(
      and(
        eq(safeguardingChecks.personId, personId),
        eq(safeguardingChecks.kind, kind)
      )
    )
    .orderBy(desc(safeguardingChecks.createdAt))
    .limit(1);
  if (current === undefined) {
    await tx.insert(safeguardingChecks).values({
      ...values,
      kind,
      organizationId: caller.organizationId,
      personId,
      status: "pending",
    });
    return;
  }
  await tx
    .update(safeguardingChecks)
    .set({ ...values, status: "pending", verifiedAt: null, verifiedBy: null })
    .where(eq(safeguardingChecks.id, current.id));
};

const saveDbs = async (
  tx: Tx,
  caller: Caller,
  data: z.infer<typeof memberStepSchemas.dbs>
) => {
  const personId = await ensureOwnPerson(tx, caller);
  const { dbs, firstAidExpiresOn, safeguardingTrainingExpiresOn } = data;
  const work: Promise<void>[] = [];
  if (dbs !== null && dbs !== undefined) {
    work.push(
      upsertCheck(tx, caller, personId, "dbs", {
        dbsLevel: dbs.level,
        dbsUpdateService: dbs.onUpdateService,
        expiresOn: dbs.expiresOn ?? null,
        fileId: dbs.fileId ?? null,
        issuedOn: dbs.issuedOn ?? null,
        reference: dbs.reference ?? null,
      })
    );
  }
  if (firstAidExpiresOn !== null && firstAidExpiresOn !== undefined) {
    work.push(
      upsertCheck(tx, caller, personId, "first_aid", {
        expiresOn: firstAidExpiresOn,
      })
    );
  }
  if (
    safeguardingTrainingExpiresOn !== null &&
    safeguardingTrainingExpiresOn !== undefined
  ) {
    work.push(
      upsertCheck(tx, caller, personId, "safeguarding_training", {
        expiresOn: safeguardingTrainingExpiresOn,
      })
    );
  }
  await Promise.all(work);

  const { coaching } = data;
  if (coaching === null || coaching === undefined) {
    return;
  }
  const values = {
    awardedBy: coaching.awardedBy ?? null,
    expiresOn: coaching.expiresOn ?? null,
    issuedOn: coaching.issuedOn ?? null,
    title: coaching.title,
  };
  const [current] = await tx
    .select({ id: qualifications.id })
    .from(qualifications)
    .where(
      and(
        eq(qualifications.personId, personId),
        eq(qualifications.kind, "coaching"),
        eq(qualifications.title, coaching.title)
      )
    );
  if (current === undefined) {
    await tx.insert(qualifications).values({
      ...values,
      kind: "coaching",
      organizationId: caller.organizationId,
      personId,
    });
    return;
  }
  await tx
    .update(qualifications)
    .set(values)
    .where(eq(qualifications.id, current.id));
};

const saveAvailability = async (
  tx: Tx,
  caller: Caller,
  data: z.infer<typeof memberStepSchemas.availability>
) => {
  const personId = await ensureOwnPerson(tx, caller);
  const { organizationId } = caller;
  await tx
    .delete(personAvailability)
    .where(eq(personAvailability.personId, personId));
  if (data.slots.length > 0) {
    await tx
      .insert(personAvailability)
      .values(data.slots.map((slot) => ({ ...slot, organizationId, personId })))
      .onConflictDoNothing();
  }
  if (data.notes !== null && data.notes !== undefined) {
    await tx
      .insert(playerProfiles)
      .values({ notes: data.notes, organizationId, personId })
      .onConflictDoUpdate({
        set: { notes: data.notes },
        target: playerProfiles.personId,
      });
  }
};

const saveOneChild = async (
  tx: Tx,
  caller: Caller,
  parentId: string,
  child: ChildInput,
  ownedIds: Set<string>
) => {
  const { organizationId } = caller;
  let childId = child.id;
  if (childId === undefined) {
    const [created] = await tx
      .insert(people)
      .values({
        dateOfBirth: child.dateOfBirth,
        firstName: child.firstName,
        lastName: child.lastName,
        organizationId,
      })
      .returning({ id: people.id });
    if (created === undefined) {
      throw new Error("Child was not created");
    }
    childId = created.id;
    await tx.insert(personRelationships).values({
      canCollect: true,
      hasParentalResponsibility: true,
      isEmergencyContact: true,
      organizationId,
      personId: childId,
      relatedPersonId: parentId,
      relationship: "parent",
    });
  } else {
    if (!ownedIds.has(childId)) {
      throw new NotYourChildError();
    }
    await tx
      .update(people)
      .set({
        dateOfBirth: child.dateOfBirth,
        firstName: child.firstName,
        lastName: child.lastName,
      })
      .where(eq(people.id, childId));
  }
  if (child.position !== undefined && child.position !== null) {
    await tx
      .insert(playerProfiles)
      .values({
        organizationId,
        personId: childId,
        primaryPosition: child.position,
      })
      .onConflictDoUpdate({
        set: { primaryPosition: child.position },
        target: playerProfiles.personId,
      });
  }
  if (child.kit !== undefined) {
    await upsertKit(tx, organizationId, childId, child.kit);
  }
  if (child.medical !== undefined) {
    await saveMedical(tx, organizationId, childId, child.medical);
  }
  if (child.consents !== undefined) {
    await applyConsents(tx, organizationId, childId, parentId, child.consents);
  }
  if (child.otherGuardian !== null && child.otherGuardian !== undefined) {
    const guardian = child.otherGuardian;
    const [created] = await tx
      .insert(people)
      .values({
        email: guardian.email ?? null,
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        organizationId,
        phone: guardian.phone ?? null,
      })
      .returning({ id: people.id });
    if (created === undefined) {
      throw new Error("Guardian was not created");
    }
    await tx.insert(personRelationships).values({
      canCollect: true,
      hasParentalResponsibility: guardian.hasParentalResponsibility,
      isEmergencyContact: guardian.isEmergencyContact,
      organizationId,
      personId: childId,
      relatedPersonId: created.id,
      relationship: guardian.relationship,
    });
  }
};

const saveChildren = async (
  tx: Tx,
  caller: Caller,
  data: z.infer<typeof memberStepSchemas.children>
) => {
  const parentId = await ensureOwnPerson(tx, caller);
  const ownedIds = await ownChildIds(tx, caller.organizationId, parentId);
  if (data.archiveChildIds.some((id) => !ownedIds.has(id))) {
    throw new NotYourChildError();
  }
  await Promise.all(
    data.children.map(async (child) => {
      await saveOneChild(tx, caller, parentId, child, ownedIds);
    })
  );
  if (data.archiveChildIds.length > 0) {
    await tx
      .update(people)
      .set({ isActive: false })
      .where(inArray(people.id, data.archiveChildIds));
  }
};

const savePermissions = async (
  tx: Tx,
  caller: Caller,
  data: z.infer<typeof memberStepSchemas.permissions>
) => {
  const personId = await ensureOwnPerson(tx, caller);
  const { organizationId } = caller;
  if (data.self !== undefined) {
    await applyConsents(tx, organizationId, personId, personId, data.self);
  }
  const ownedIds = await ownChildIds(tx, organizationId, personId);
  if (data.children.some((child) => !ownedIds.has(child.id))) {
    throw new NotYourChildError();
  }
  await Promise.all(
    data.children.map(async (child) => {
      await applyConsents(
        tx,
        organizationId,
        child.id,
        personId,
        child.consents
      );
    })
  );
};

const saveBilling = async (
  tx: Tx,
  caller: Caller,
  data: z.infer<typeof memberStepSchemas.billing>
) => {
  const personId = await ensureOwnPerson(tx, caller);
  const values = {
    billingEmail: data.billingEmail ?? null,
    method: data.method ?? null,
    payer: data.payer ?? null,
    secondPayerEmail: data.secondPayerEmail ?? null,
    secondPayerName: data.secondPayerName ?? null,
    sendReminders: data.sendReminders,
  };
  await tx
    .insert(memberBillingPreferences)
    .values({ organizationId: caller.organizationId, personId, ...values })
    .onConflictDoUpdate({
      set: values,
      target: memberBillingPreferences.personId,
    });
};

const saveSocial = async (
  tx: Tx,
  caller: Caller,
  data: z.infer<typeof memberStepSchemas.social>
) => {
  const personId = await ensureOwnPerson(tx, caller);
  await applyConsents(
    tx,
    caller.organizationId,
    personId,
    personId,
    data.consents
  );
  const { organizationId } = caller;
  await tx
    .delete(personSocialLinks)
    .where(eq(personSocialLinks.personId, personId));
  if (data.links.length > 0) {
    await tx
      .insert(personSocialLinks)
      .values(data.links.map((link) => ({ ...link, organizationId, personId })))
      .onConflictDoUpdate({
        set: { handle: sql`excluded.handle` },
        target: [personSocialLinks.personId, personSocialLinks.platform],
      });
  }
};

/** Remembers how the person said they are joining: staff, player or parent. */
const saveRole = async (
  tx: Tx,
  caller: Caller,
  data: z.infer<typeof memberStepSchemas.role>
) => {
  const personId = await ensureOwnPerson(tx, caller);
  await tx
    .insert(memberJoiningRoles)
    .values({
      joinedAs: data.role,
      organizationId: caller.organizationId,
      personId,
    })
    .onConflictDoUpdate({
      set: { joinedAs: data.role },
      target: memberJoiningRoles.personId,
    });
};

/**
 * Saves one people-wizard step for the signed-in person (and, where the step
 * names them, their own children). Everything is scoped to the caller: a child
 * id that is not linked to them as a parent throws NotYourChildError.
 * `role` stores what the person picked; the club's own jobs for them (coach,
 * welfare officer) are set separately in `role_assignments`.
 */
export const saveMemberStep = async (
  db: Database,
  caller: Caller,
  input: MemberStepInput
): Promise<void> => {
  await db.transaction(async (tx) => {
    switch (input.step) {
      case "address": {
        await saveAddress(tx, caller, input.data);
        return;
      }
      case "availability": {
        await saveAvailability(tx, caller, input.data);
        return;
      }
      case "billing": {
        await saveBilling(tx, caller, input.data);
        return;
      }
      case "children": {
        await saveChildren(tx, caller, input.data);
        return;
      }
      case "dbs": {
        await saveDbs(tx, caller, input.data);
        return;
      }
      case "details": {
        await saveDetails(tx, caller, input.data);
        return;
      }
      case "permissions": {
        await savePermissions(tx, caller, input.data);
        return;
      }
      case "role": {
        await saveRole(tx, caller, input.data);
        return;
      }
      case "safety": {
        await saveSafety(tx, caller, input.data);
        return;
      }
      case "social": {
        await saveSocial(tx, caller, input.data);
        break;
      }
      default: {
        // Unreachable: every step is handled above.
        break;
      }
    }
  });
};
