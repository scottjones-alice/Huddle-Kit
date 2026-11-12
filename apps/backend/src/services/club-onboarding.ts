import {
  CLUB_SECTIONS,
  CLUB_TYPES,
  FEE_FREQUENCIES,
  LEGAL_STRUCTURES,
  SOCIAL_PLATFORMS,
  addresses,
  clubFeeSettings,
  clubProfiles,
  clubSettings,
  clubSocialLinks,
  clubTrainingSlots,
  organizations,
  venues,
} from "@alice/database";
import type { Database, VenueKind } from "@alice/database";
import { z } from "@hono/zod-openapi";
import { and, eq, ne } from "drizzle-orm";

const HOME_GROUND_KINDS: VenueKind[] = ["training_ground", "match_venue"];
const MAX_TEXT = 200;
const MAX_URL = 500;
const MAX_SLOTS = 28;
const MIN_YEAR = 1850;
const MAX_MONEY_MINOR = 10_000_000;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/u;
const text = () => z.string().trim().min(1).max(MAX_TEXT);
const optionalText = () => z.string().trim().max(MAX_TEXT).nullish();
const minor = () => z.number().int().min(0).max(MAX_MONEY_MINOR);

/** The request body for each club step the wizard saves. */
export const clubStepSchemas = {
  club: z.object({
    affiliationNumber: optionalText(),
    clubType: z.enum(CLUB_TYPES),
    contactEmail: z.email().nullish(),
    contactPhone: optionalText(),
    countyFa: optionalText(),
    foundedYear: z
      .number()
      .int()
      .min(MIN_YEAR)
      .max(new Date().getFullYear())
      .nullish(),
    leagues: optionalText(),
    name: text(),
    sections: z.array(z.enum(CLUB_SECTIONS)).min(1),
    slug: z.string().min(2).max(60).regex(SLUG_PATTERN),
    website: z.url().max(MAX_URL).nullish(),
  }),
  fees: z.object({
    absorbDirectDebitFee: z.boolean(),
    frequency: z.enum(FEE_FREQUENCIES),
    joiningFeeMinor: minor().nullish(),
    kitFeeMinor: minor().nullish(),
    lateReminders: z.boolean(),
    matchFeeMinor: minor().nullish(),
    siblingDiscount: z.boolean(),
    subscriptionMinor: minor(),
  }),
  governance: z.object({
    constitutionFileId: z.uuid().nullish(),
    insuranceCertificateFileId: z.uuid().nullish(),
    insuranceExpiresOn: z.iso.date().nullish(),
    insurancePolicyNumber: optionalText(),
    insuranceProvider: optionalText(),
    legalStructure: z.enum(LEGAL_STRUCTURES),
    registrationNumber: optionalText(),
    safeguardingPolicyFileId: z.uuid().nullish(),
    safeguardingPolicyReviewOn: z.iso.date().nullish(),
    vatNumber: optionalText(),
    vatRegistered: z.boolean(),
    welfareOfficerEmail: z.email().nullish(),
    welfareOfficerName: optionalText(),
  }),
  location: z.object({
    city: text(),
    countryCode: z.string().regex(/^[A-Z]{2}$/u),
    directions: optionalText(),
    line1: text(),
    line2: optionalText(),
    postalCode: optionalText(),
    region: optionalText(),
    venueName: text(),
  }),
  schedule: z.object({
    slots: z
      .array(
        z
          .object({
            dayOfWeek: z.number().int().min(1).max(7),
            endsAt: z.string().regex(TIME_PATTERN),
            startsAt: z.string().regex(TIME_PATTERN),
          })
          .refine((slot) => slot.endsAt > slot.startsAt, {
            message: "A session must end after it starts",
            path: ["endsAt"],
          })
      )
      .max(MAX_SLOTS),
  }),
  social: z.object({
    copyParentsOnMessages: z.boolean(),
    links: z
      .array(
        z.object({
          platform: z.enum(SOCIAL_PLATFORMS),
          url: z.url().max(MAX_URL),
        })
      )
      .max(SOCIAL_PLATFORMS.length),
    noPrivateMessages: z.boolean(),
    publishResults: z.boolean(),
  }),
} as const;

export type ClubStepName = keyof typeof clubStepSchemas;

export class SlugTakenError extends Error {
  constructor() {
    super("That club address is already taken");
    this.name = "SlugTakenError";
  }
}

type Input<S extends ClubStepName> = z.infer<(typeof clubStepSchemas)[S]>;

const saveClub = async (
  db: Database,
  organizationId: string,
  input: Input<"club">
) => {
  const taken = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(
      and(
        eq(organizations.slug, input.slug),
        ne(organizations.id, organizationId)
      )
    );
  if (taken.length > 0) {
    throw new SlugTakenError();
  }
  await db.transaction(async (tx) => {
    await tx
      .update(organizations)
      .set({ name: input.name, slug: input.slug })
      .where(eq(organizations.id, organizationId));
    const profile = {
      affiliationNumber: input.affiliationNumber ?? null,
      clubType: input.clubType,
      countyFa: input.countyFa ?? null,
      foundedYear: input.foundedYear ?? null,
      leagues: input.leagues ?? null,
      sections: input.sections,
    };
    await tx
      .insert(clubProfiles)
      .values({ organizationId, ...profile })
      .onConflictDoUpdate({
        set: profile,
        target: clubProfiles.organizationId,
      });
    const contact = {
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      website: input.website ?? null,
    };
    await tx
      .insert(clubSettings)
      .values({ organizationId, ...contact })
      .onConflictDoUpdate({
        set: contact,
        target: clubSettings.organizationId,
      });
  });
};

const saveLocation = async (
  db: Database,
  organizationId: string,
  input: Input<"location">
) => {
  await db.transaction(async (tx) => {
    const address = {
      city: input.city,
      countryCode: input.countryCode,
      line1: input.line1,
      line2: input.line2 ?? null,
      postalCode: input.postalCode ?? null,
      region: input.region ?? null,
    };
    const [settings] = await tx
      .select({
        addressId: clubSettings.addressId,
        homeVenueId: clubSettings.homeVenueId,
      })
      .from(clubSettings)
      .where(eq(clubSettings.organizationId, organizationId));

    const [venue] =
      settings?.homeVenueId === null || settings?.homeVenueId === undefined
        ? []
        : await tx
            .select({ addressId: venues.addressId, id: venues.id })
            .from(venues)
            .where(eq(venues.id, settings.homeVenueId));

    if (venue === undefined) {
      const [created] = await tx
        .insert(addresses)
        .values({ organizationId, ...address })
        .returning({ id: addresses.id });
      if (created === undefined) {
        throw new Error("Address was not created");
      }
      const [newVenue] = await tx
        .insert(venues)
        .values({
          addressId: created.id,
          directions: input.directions ?? null,
          kinds: HOME_GROUND_KINDS,
          name: input.venueName,
          organizationId,
        })
        .returning({ id: venues.id });
      if (newVenue === undefined) {
        throw new Error("Venue was not created");
      }
      await tx
        .insert(clubSettings)
        .values({
          addressId: created.id,
          homeVenueId: newVenue.id,
          organizationId,
        })
        .onConflictDoUpdate({
          set: { addressId: created.id, homeVenueId: newVenue.id },
          target: clubSettings.organizationId,
        });
      return;
    }

    await tx
      .update(addresses)
      .set(address)
      .where(eq(addresses.id, venue.addressId));
    await tx
      .update(venues)
      .set({ directions: input.directions ?? null, name: input.venueName })
      .where(eq(venues.id, venue.id));
  });
};

const saveGovernance = async (
  db: Database,
  organizationId: string,
  input: Input<"governance">
) => {
  const values = {
    constitutionFileId: input.constitutionFileId ?? null,
    insuranceCertificateFileId: input.insuranceCertificateFileId ?? null,
    insuranceExpiresOn: input.insuranceExpiresOn ?? null,
    insurancePolicyNumber: input.insurancePolicyNumber ?? null,
    insuranceProvider: input.insuranceProvider ?? null,
    legalStructure: input.legalStructure,
    registrationNumber: input.registrationNumber ?? null,
    safeguardingPolicyFileId: input.safeguardingPolicyFileId ?? null,
    safeguardingPolicyReviewOn: input.safeguardingPolicyReviewOn ?? null,
    vatNumber: input.vatRegistered ? (input.vatNumber ?? null) : null,
    vatRegistered: input.vatRegistered,
    welfareOfficerEmail: input.welfareOfficerEmail ?? null,
    welfareOfficerName: input.welfareOfficerName ?? null,
  };
  await db
    .insert(clubProfiles)
    .values({ organizationId, ...values })
    .onConflictDoUpdate({ set: values, target: clubProfiles.organizationId });
};

const saveSchedule = async (
  db: Database,
  organizationId: string,
  input: Input<"schedule">
) => {
  const [settings] = await db
    .select({ homeVenueId: clubSettings.homeVenueId })
    .from(clubSettings)
    .where(eq(clubSettings.organizationId, organizationId));
  const venueId = settings?.homeVenueId;
  await db.transaction(async (tx) => {
    await tx
      .delete(clubTrainingSlots)
      .where(eq(clubTrainingSlots.organizationId, organizationId));
    if (input.slots.length > 0) {
      await tx.insert(clubTrainingSlots).values(
        input.slots.map((slot) => ({
          ...slot,
          organizationId,
          venueId: venueId ?? null,
        }))
      );
    }
  });
};

const saveFees = async (
  db: Database,
  organizationId: string,
  input: Input<"fees">
) => {
  const values = {
    absorbDirectDebitFee: input.absorbDirectDebitFee,
    frequency: input.frequency,
    joiningFeeMinor: input.joiningFeeMinor ?? null,
    kitFeeMinor: input.kitFeeMinor ?? null,
    lateReminders: input.lateReminders,
    matchFeeMinor: input.matchFeeMinor ?? null,
    siblingDiscount: input.siblingDiscount,
    subscriptionMinor: input.subscriptionMinor,
  };
  await db
    .insert(clubFeeSettings)
    .values({ organizationId, ...values })
    .onConflictDoUpdate({
      set: values,
      target: clubFeeSettings.organizationId,
    });
};

const saveSocial = async (
  db: Database,
  organizationId: string,
  input: Input<"social">
) => {
  const policy = {
    copyParentsOnMessages: input.copyParentsOnMessages,
    noPrivateMessages: input.noPrivateMessages,
    publishResults: input.publishResults,
  };
  await db.transaction(async (tx) => {
    await tx
      .insert(clubProfiles)
      .values({ organizationId, ...policy })
      .onConflictDoUpdate({ set: policy, target: clubProfiles.organizationId });
    await tx
      .delete(clubSocialLinks)
      .where(eq(clubSocialLinks.organizationId, organizationId));
    if (input.links.length > 0) {
      await tx
        .insert(clubSocialLinks)
        .values(input.links.map((link) => ({ ...link, organizationId })));
    }
  });
};

export const clubStepInputSchema = z.discriminatedUnion("step", [
  z.object({ data: clubStepSchemas.club, step: z.literal("club") }),
  z.object({ data: clubStepSchemas.fees, step: z.literal("fees") }),
  z.object({ data: clubStepSchemas.governance, step: z.literal("governance") }),
  z.object({ data: clubStepSchemas.location, step: z.literal("location") }),
  z.object({ data: clubStepSchemas.schedule, step: z.literal("schedule") }),
  z.object({ data: clubStepSchemas.social, step: z.literal("social") }),
]);
export type ClubStepInput = z.infer<typeof clubStepInputSchema>;

/** Saves one wizard step. `input` must come from `clubStepInputSchema`. */
export const saveClubStep = async (
  db: Database,
  organizationId: string,
  input: ClubStepInput
): Promise<void> => {
  switch (input.step) {
    case "club": {
      await saveClub(db, organizationId, input.data);
      return;
    }
    case "location": {
      await saveLocation(db, organizationId, input.data);
      return;
    }
    case "governance": {
      await saveGovernance(db, organizationId, input.data);
      return;
    }
    case "schedule": {
      await saveSchedule(db, organizationId, input.data);
      return;
    }
    case "fees": {
      await saveFees(db, organizationId, input.data);
      return;
    }
    case "social": {
      await saveSocial(db, organizationId, input.data);
      return;
    }
    default: {
      throw new Error("Unknown club step");
    }
  }
};
