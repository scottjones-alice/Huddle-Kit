import {
  AVAILABILITY_SLOTS,
  PAYERS,
  PAYMENT_METHODS_PREFERRED,
  PICKUP_RULES,
  addresses,
  allergies,
  consents,
  medicalRecords,
  memberBillingPreferences,
  people,
  personAvailability,
  personDemographics,
  personKit,
  personRelationships,
  playerProfiles,
  qualifications,
  safeguardingChecks,
  users,
} from "@alice/database";
import type { Database } from "@alice/database";
import { z } from "@hono/zod-openapi";
import { and, eq, inArray, isNull } from "drizzle-orm";

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
  children: z.object({ children: z.array(childSchema).min(1).max(MAX_ITEMS) }),
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
  role: z.object({ role: z.enum(["staff", "player", "parent"]) }),
  safety: z.object({
    contacts: z.array(contactSchema).max(MAX_ITEMS).default([]),
    emergencyTreatment: z.boolean().optional(),
    medical: medicalSchema.optional(),
  }),
  social: z.object({
    consents: consentFlags,
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

const saveMedical = async (
  tx: Tx,
  organizationId: string,
  personId: string,
  medical: z.infer<typeof medicalSchema>
) => {
  await tx
    .delete(medicalRecords)
    .where(
      and(
        eq(medicalRecords.personId, personId),
        inArray(medicalRecords.kind, ["condition", "medication"])
      )
    );
  await tx.delete(allergies).where(eq(allergies.personId, personId));
  const records = [
    medical.conditions === null || medical.conditions === undefined
      ? undefined
      : {
          details: medical.conditions,
          isEmergencyRelevant: true,
          kind: "condition" as const,
          name: "Medical conditions",
        },
    medical.medication === null || medical.medication === undefined
      ? undefined
      : {
          details: medical.medication,
          isEmergencyRelevant: true,
          kind: "medication" as const,
          name: "Medication",
        },
  ].filter((record) => record !== undefined);
  if (records.length > 0) {
    await tx
      .insert(medicalRecords)
      .values(
        records.map((record) => ({ ...record, organizationId, personId }))
      );
  }
  if (medical.allergies.length > 0) {
    await tx.insert(allergies).values(
      medical.allergies.map((allergy) => ({
        ...allergy,
        organizationId,
        personId,
      }))
    );
  }
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
  // Replace the contacts this person set up earlier. Contacts who are also
  // account holders keep their own row; only the link is removed.
  const old = await tx
    .select({ related: personRelationships.relatedPersonId })
    .from(personRelationships)
    .where(
      and(
        eq(personRelationships.personId, personId),
        eq(personRelationships.isEmergencyContact, true),
        eq(personRelationships.hasParentalResponsibility, false)
      )
    );
  await tx
    .delete(personRelationships)
    .where(
      and(
        eq(personRelationships.personId, personId),
        eq(personRelationships.isEmergencyContact, true),
        eq(personRelationships.hasParentalResponsibility, false)
      )
    );
  if (old.length > 0) {
    // Orphaned contacts (no login, no other link) are removed with their link.
    await tx.delete(people).where(
      and(
        inArray(
          people.id,
          old.map((row) => row.related)
        ),
        eq(people.organizationId, organizationId),
        eq(people.isActive, true)
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

const replaceByKind = async (
  tx: Tx,
  personId: string,
  kinds: ("dbs" | "first_aid" | "safeguarding_training")[]
) => {
  await tx
    .delete(safeguardingChecks)
    .where(
      and(
        eq(safeguardingChecks.personId, personId),
        inArray(safeguardingChecks.kind, kinds)
      )
    );
};

const saveDbs = async (
  tx: Tx,
  caller: Caller,
  data: z.infer<typeof memberStepSchemas.dbs>
) => {
  const personId = await ensureOwnPerson(tx, caller);
  const { organizationId } = caller;
  // Self-reported checks start as "pending": only a club admin marks them valid.
  await replaceByKind(tx, personId, [
    "dbs",
    "first_aid",
    "safeguarding_training",
  ]);
  const rows = [
    data.dbs === null || data.dbs === undefined
      ? undefined
      : {
          dbsLevel: data.dbs.level,
          dbsUpdateService: data.dbs.onUpdateService,
          expiresOn: data.dbs.expiresOn ?? null,
          fileId: data.dbs.fileId ?? null,
          issuedOn: data.dbs.issuedOn ?? null,
          kind: "dbs" as const,
          reference: data.dbs.reference ?? null,
        },
    data.firstAidExpiresOn === null || data.firstAidExpiresOn === undefined
      ? undefined
      : { expiresOn: data.firstAidExpiresOn, kind: "first_aid" as const },
    data.safeguardingTrainingExpiresOn === null ||
    data.safeguardingTrainingExpiresOn === undefined
      ? undefined
      : {
          expiresOn: data.safeguardingTrainingExpiresOn,
          kind: "safeguarding_training" as const,
        },
  ].filter((row) => row !== undefined);
  if (rows.length > 0) {
    await tx.insert(safeguardingChecks).values(
      rows.map((row) => ({
        ...row,
        organizationId,
        personId,
        status: "pending" as const,
      }))
    );
  }
  await tx
    .delete(qualifications)
    .where(
      and(
        eq(qualifications.personId, personId),
        eq(qualifications.kind, "coaching")
      )
    );
  if (data.coaching !== null && data.coaching !== undefined) {
    await tx.insert(qualifications).values({
      awardedBy: data.coaching.awardedBy ?? null,
      expiresOn: data.coaching.expiresOn ?? null,
      issuedOn: data.coaching.issuedOn ?? null,
      kind: "coaching",
      organizationId,
      personId,
      title: data.coaching.title,
    });
  }
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
  await Promise.all(
    data.children.map(async (child) => {
      await saveOneChild(tx, caller, parentId, child, ownedIds);
    })
  );
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
};

/**
 * Saves one people-wizard step for the signed-in person (and, where the step
 * names them, their own children). Everything is scoped to the caller: a child
 * id that is not linked to them as a parent throws NotYourChildError.
 * `role` records nothing: the club decides a member's role when it invites them.
 */
export const saveMemberStep = async (
  db: Database,
  caller: Caller,
  input: MemberStepInput
): Promise<void> => {
  // "role" carries no data: the club sets a member's role when it invites them.
  if (input.step === "role") {
    return;
  }
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
      case "safety": {
        await saveSafety(tx, caller, input.data);
        return;
      }
      case "social": {
        await saveSocial(tx, caller, input.data);
        break;
      }
      default: {
        // Unreachable: the switch covers every step except "role", handled above.
        break;
      }
    }
  });
};
