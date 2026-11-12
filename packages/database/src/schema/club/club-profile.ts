/**
 * What the club wizard collects beyond the name, logo and contact details that
 * already live on `organizations` and `club_settings`: the FA and legal
 * details, safeguarding policy, insurance, how the club talks to families,
 * fees, social links and training times. Uploaded documents are rows in
 * `files`, referenced by id.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { files } from "../files/files";
import { isNonEmptyArrayOf, isOneOf } from "../shared/constraints";
import { venues } from "./venues";

export const CLUB_TYPES = [
  "grassroots",
  "academy",
  "school-or-college",
  "community-or-charity",
  "other",
] as const;
export type ClubType = (typeof CLUB_TYPES)[number];

export const CLUB_SECTIONS = [
  "mini-soccer",
  "youth",
  "adult-men",
  "adult-women",
  "veterans",
  "disability",
] as const;
export type ClubSection = (typeof CLUB_SECTIONS)[number];

export const LEGAL_STRUCTURES = [
  "unincorporated-association",
  "cic",
  "registered-charity",
  "company-limited-by-guarantee",
  "company-limited-by-shares",
  "other",
] as const;
export type LegalStructure = (typeof LEGAL_STRUCTURES)[number];

export const FEE_FREQUENCIES = [
  "monthly",
  "termly",
  "annually",
  "per-session",
] as const;
export type FeeFrequency = (typeof FEE_FREQUENCIES)[number];

export const SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "tiktok",
  "x",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

const updatedAtColumn = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull();

const organizationKey = () =>
  uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" });

export const clubProfiles = pgTable(
  "club_profiles",
  {
    affiliationNumber: text("affiliation_number"),
    clubType: text("club_type").$type<ClubType>(),
    constitutionFileId: uuid("constitution_file_id").references(
      () => files.id,
      { onDelete: "set null" }
    ),
    copyParentsOnMessages: boolean("copy_parents_on_messages")
      .default(true)
      .notNull(),
    countyFa: text("county_fa"),
    foundedYear: smallint("founded_year"),
    insuranceCertificateFileId: uuid(
      "insurance_certificate_file_id"
    ).references(() => files.id, { onDelete: "set null" }),
    insuranceExpiresOn: date("insurance_expires_on", { mode: "string" }),
    insurancePolicyNumber: text("insurance_policy_number"),
    insuranceProvider: text("insurance_provider"),
    leagues: text("leagues"),
    legalStructure: text("legal_structure").$type<LegalStructure>(),
    noPrivateMessages: boolean("no_private_messages").default(true).notNull(),
    organizationId: uuid("organization_id")
      .primaryKey()
      .references(() => organizations.id, { onDelete: "cascade" }),
    publishResults: boolean("publish_results").default(false).notNull(),
    registrationNumber: text("registration_number"),
    safeguardingPolicyFileId: uuid("safeguarding_policy_file_id").references(
      () => files.id,
      { onDelete: "set null" }
    ),
    safeguardingPolicyReviewOn: date("safeguarding_policy_review_on", {
      mode: "string",
    }),
    sections: text("sections").$type<ClubSection>().array(),
    updatedAt: updatedAtColumn(),
    vatNumber: text("vat_number"),
    vatRegistered: boolean("vat_registered").default(false).notNull(),
    welfareOfficerEmail: text("welfare_officer_email"),
    welfareOfficerName: text("welfare_officer_name"),
  },
  (table) => [
    check("club_profiles_type_chk", isOneOf(table.clubType, CLUB_TYPES)),
    check(
      "club_profiles_legal_chk",
      isOneOf(table.legalStructure, LEGAL_STRUCTURES)
    ),
    check(
      "club_profiles_sections_chk",
      sql`${table.sections} is null or (${isNonEmptyArrayOf(table.sections, CLUB_SECTIONS)})`
    ),
  ]
);

/** Default prices for the club, in pence. Per-team fees come later, in `fees`. */
export const clubFeeSettings = pgTable(
  "club_fee_settings",
  {
    absorbDirectDebitFee: boolean("absorb_direct_debit_fee")
      .default(false)
      .notNull(),
    frequency: text("frequency").$type<FeeFrequency>().notNull(),
    joiningFeeMinor: integer("joining_fee_minor"),
    kitFeeMinor: integer("kit_fee_minor"),
    lateReminders: boolean("late_reminders").default(true).notNull(),
    matchFeeMinor: integer("match_fee_minor"),
    organizationId: uuid("organization_id")
      .primaryKey()
      .references(() => organizations.id, { onDelete: "cascade" }),
    siblingDiscount: boolean("sibling_discount").default(false).notNull(),
    subscriptionMinor: integer("subscription_minor").notNull(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    check(
      "club_fee_settings_frequency_chk",
      isOneOf(table.frequency, FEE_FREQUENCIES)
    ),
    check(
      "club_fee_settings_amounts_chk",
      sql`${table.subscriptionMinor} >= 0 and coalesce(${table.matchFeeMinor}, 0) >= 0 and coalesce(${table.joiningFeeMinor}, 0) >= 0 and coalesce(${table.kitFeeMinor}, 0) >= 0`
    ),
  ]
);

export const clubSocialLinks = pgTable(
  "club_social_links",
  {
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    organizationId: organizationKey(),
    platform: text("platform").$type<SocialPlatform>().notNull(),
    updatedAt: updatedAtColumn(),
    url: text("url").notNull(),
  },
  (table) => [
    check(
      "club_social_links_platform_chk",
      isOneOf(table.platform, SOCIAL_PLATFORMS)
    ),
    uniqueIndex("club_social_links_organizationId_platform_uidx").on(
      table.organizationId,
      table.platform
    ),
  ]
);

/** Day 1 is Monday, 7 is Sunday (ISO). Times are local to the club. */
export const clubTrainingSlots = pgTable(
  "club_training_slots",
  {
    dayOfWeek: smallint("day_of_week").notNull(),
    endsAt: time("ends_at").notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    organizationId: organizationKey(),
    startsAt: time("starts_at").notNull(),
    updatedAt: updatedAtColumn(),
    venueId: uuid("venue_id").references(() => venues.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    check(
      "club_training_slots_times_chk",
      sql`${table.dayOfWeek} between 1 and 7 and ${table.endsAt} > ${table.startsAt}`
    ),
    index("club_training_slots_organizationId_idx").on(table.organizationId),
    index("club_training_slots_venueId_idx").on(table.venueId),
  ]
);

export const clubProfileRelations = defineRelationsPart(
  {
    clubFeeSettings,
    clubProfiles,
    clubSocialLinks,
    clubTrainingSlots,
    organizations,
    venues,
  },
  (r) => ({
    clubFeeSettings: {
      organization: r.one.organizations({
        from: r.clubFeeSettings.organizationId,
        to: r.organizations.id,
      }),
    },
    clubProfiles: {
      organization: r.one.organizations({
        from: r.clubProfiles.organizationId,
        to: r.organizations.id,
      }),
    },
    clubSocialLinks: {
      organization: r.one.organizations({
        from: r.clubSocialLinks.organizationId,
        to: r.organizations.id,
      }),
    },
    clubTrainingSlots: {
      organization: r.one.organizations({
        from: r.clubTrainingSlots.organizationId,
        to: r.organizations.id,
      }),
      venue: r.one.venues({
        from: r.clubTrainingSlots.venueId,
        to: r.venues.id,
      }),
    },
  })
);
