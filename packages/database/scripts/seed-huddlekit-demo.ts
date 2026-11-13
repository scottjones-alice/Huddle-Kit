/* oxlint-disable no-await-in-loop, no-await-expression-member, no-bitwise, no-inline-comments, unicorn/no-unreadable-array-destructuring, prefer-named-capture-group, no-plusplus, no-nested-ternary, unicorn/no-array-for-each, react-doctor/async-parallel, react-doctor/async-await-in-loop, typescript/no-unsafe-type-assertion, typescript/non-nullable-type-assertion-style, typescript/strict-void-return -- a one-off dev seeder: generators index into fixed lists, and inserts must run in foreign-key order, one after another. */
/**
 * Huddle Kit demo club seeder.
 *
 * Creates a fictional football club with teams, players, parents, staff, fixtures,
 * training, fees, consents and welfare records, so every screen has something to show.
 *
 *   pnpm --filter @alice/database db:seed           # asks questions, one at a time
 *   pnpm --filter @alice/database db:seed --yes     # no questions: defaults and DEMO_* variables
 *
 * Variables (all optional): DEMO_CLUB_NAME, DEMO_OWNER_NAME, DEMO_OWNER_EMAIL, DEMO_PASSWORD.
 * With --yes you must also set ALLOW_DEMO_SEED=yes.
 *
 * The owner and the club are written the way Better Auth writes them (password hashed with
 * Better Auth's own function). Every other row is validated with the schemas from
 * `../src/validation` before it is inserted. Everything runs in one transaction, so a
 * failure leaves the database as it was. Never run this against a production database.
 */
import crypto from "node:crypto";
import { createInterface } from "node:readline/promises";

import { hashPassword } from "better-auth/crypto";
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { z } from "zod";

import { createDatabase } from "../src/create-database";
import type { Database } from "../src/create-database";
import { createFieldEncryptor, keyFromBase64 } from "../src/field-encryption";
import { keys } from "../src/keys";
import {
  accounts,
  members,
  organizations,
  users,
} from "../src/schema/authentication";
import { clubSettings } from "../src/schema/club/club-settings";
import { opponents } from "../src/schema/club/opponents";
import { pitches } from "../src/schema/club/pitches";
import { venues } from "../src/schema/club/venues";
import { announcements } from "../src/schema/communications/announcements";
import { notifications } from "../src/schema/communications/notifications";
import { feeCharges } from "../src/schema/finance/fee-charges";
import { fees } from "../src/schema/finance/fees";
import { payments } from "../src/schema/finance/payments";
import { eventAttendance } from "../src/schema/football/event-attendance";
import { eventAvailability } from "../src/schema/football/event-availability";
import { eventSeries } from "../src/schema/football/event-series";
import { events } from "../src/schema/football/events";
import { matchDetails } from "../src/schema/football/match-details";
import { matchSquad } from "../src/schema/football/match-squad";
import { registrations } from "../src/schema/football/registrations";
import { seasons } from "../src/schema/football/seasons";
import { teamMemberships } from "../src/schema/football/team-memberships";
import { teams } from "../src/schema/football/teams";
import { auditEvents } from "../src/schema/governance/audit-events";
import { consents } from "../src/schema/governance/consent";
import { consentDocuments } from "../src/schema/governance/consent-documents";
import { roleAssignmentTeams } from "../src/schema/governance/role-assignment-teams";
import type { RoleAssignmentRole } from "../src/schema/governance/role-assignments";
import { roleAssignments } from "../src/schema/governance/role-assignments";
import { onboardingSteps } from "../src/schema/onboarding/onboarding-steps";
import { addresses } from "../src/schema/people/addresses";
import { allergies } from "../src/schema/people/allergies";
import { medicalRecords } from "../src/schema/people/medical-records";
import { people } from "../src/schema/people/people";
import { personIdentifiers } from "../src/schema/people/person-identifiers";
import { playerProfiles } from "../src/schema/people/player-profiles";
import { qualifications } from "../src/schema/people/qualifications";
import { personRelationships } from "../src/schema/people/relationships";
import { safeguardingChecks } from "../src/schema/safeguarding/checks";
import { safeguardingConcerns } from "../src/schema/safeguarding/concerns";
import { safeguardingNotes } from "../src/schema/safeguarding/notes";
import { incidentReports } from "../src/schema/welfare/incident-reports";
import * as validation from "../src/validation";

config({ path: "../../.env", quiet: true });

// ---------------------------------------------------------------------------
// Options and the question-by-question walkthrough
// ---------------------------------------------------------------------------

type Scale = "full" | "compact";

interface SeedOptions {
  clubName: string;
  includeFinance: boolean;
  includeMatches: boolean;
  includeWelfare: boolean;
  ownerEmail: string;
  ownerName: string;
  ownerPassword: string;
  passwordWasGenerated: boolean;
  scale: Scale;
  slug: string;
}

// Keep in step with PASSWORD_LIMITS.min in @alice/authentication.
const MIN_PASSWORD_LENGTH = 12;
const GENERATED_PASSWORD_BYTES = 12;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-+|-+$/gu, "");

const generatePassword = () =>
  crypto.randomBytes(GENERATED_PASSWORD_BYTES).toString("base64url");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

const askQuestions = async (): Promise<SeedOptions> => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (question: string, fallback: string) => {
    const answer = (await rl.question(`${question} [${fallback}]: `)).trim();
    return answer === "" ? fallback : answer;
  };
  const askValid = async (
    question: string,
    fallback: string,
    isValid: (value: string) => boolean,
    problem: string
  ) => {
    for (;;) {
      const answer = await ask(question, fallback);
      if (isValid(answer)) {
        return answer;
      }
      process.stdout.write(`  ${problem}\n`);
    }
  };
  const confirm = async (question: string, fallback: boolean) => {
    const answer = (
      await rl.question(`${question} [${fallback ? "Y/n" : "y/N"}]: `)
    )
      .trim()
      .toLowerCase();
    return answer === "" ? fallback : answer.startsWith("y");
  };

  try {
    process.stdout.write(
      "\nHuddle Kit demo club\nPress Enter to accept the answer in brackets.\n\n"
    );
    const clubName = await ask(
      "1. What is the club called?",
      process.env.DEMO_CLUB_NAME ?? "Salisbury Vale FC"
    );
    const slug = await askValid(
      "2. Club web address name (the slug)?",
      slugify(clubName),
      (value) => value === slugify(value) && value.length > 0,
      "Use lower-case letters, numbers and single dashes only."
    );
    const ownerName = await ask(
      "3. Owner's full name?",
      process.env.DEMO_OWNER_NAME ?? "Huddle Kit Demo Owner"
    );
    const ownerEmail = (
      await askValid(
        "4. Owner's email (this is the login)?",
        process.env.DEMO_OWNER_EMAIL ?? "demo@huddlekit.co.uk",
        (value) => EMAIL_PATTERN.test(value),
        "That does not look like an email address."
      )
    ).toLowerCase();
    process.stdout.write(
      `5. Owner's password (min ${MIN_PASSWORD_LENGTH} characters). What you type is visible.\n   Leave blank to generate one. If this email already has an account, its password is kept.\n`
    );
    const typed = await askValid(
      "   Password",
      "",
      (value) => value === "" || value.length >= MIN_PASSWORD_LENGTH,
      `Use at least ${MIN_PASSWORD_LENGTH} characters, or leave it blank.`
    );
    const scaleAnswer = await askValid(
      "6. How big a club? full = 17 teams / 292 players, compact = 4 teams",
      "full",
      (value) => value === "full" || value === "compact",
      "Type full or compact."
    );
    const includeMatches = await confirm(
      "7. Include fixtures, results and match squads?",
      true
    );
    const includeFinance = await confirm(
      "8. Include fees, charges and payments?",
      true
    );
    const includeWelfare = await confirm(
      "9. Include consents, medical, safeguarding and incident records?",
      true
    );
    const options: SeedOptions = {
      clubName,
      includeFinance,
      includeMatches,
      includeWelfare,
      ownerEmail,
      ownerName,
      ownerPassword: typed === "" ? generatePassword() : typed,
      passwordWasGenerated: typed === "",
      scale: scaleAnswer === "compact" ? "compact" : "full",
      slug,
    };
    process.stdout.write(
      `\nAbout to create "${clubName}" (${slug}), ${options.scale} size, owner ${ownerEmail}.\n`
    );
    if (!(await confirm("Go ahead?", true))) {
      throw new Error("Cancelled. Nothing was written.");
    }
    return options;
  } finally {
    rl.close();
  }
};

const defaultOptions = (): SeedOptions => {
  if (process.env.ALLOW_DEMO_SEED !== "yes") {
    throw new Error(
      "Refusing to seed without questions: set ALLOW_DEMO_SEED=yes to confirm."
    );
  }
  const clubName = process.env.DEMO_CLUB_NAME ?? "Salisbury Vale FC";
  const typed = process.env.DEMO_PASSWORD ?? "";
  if (typed !== "" && typed.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `DEMO_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`
    );
  }
  return {
    clubName,
    includeFinance: true,
    includeMatches: true,
    includeWelfare: true,
    ownerEmail: (
      process.env.DEMO_OWNER_EMAIL ?? "demo@huddlekit.co.uk"
    ).toLowerCase(),
    ownerName: process.env.DEMO_OWNER_NAME ?? "Huddle Kit Demo Owner",
    ownerPassword: typed === "" ? generatePassword() : typed,
    passwordWasGenerated: typed === "",
    scale: "full",
    slug: slugify(clubName),
  };
};

// ---------------------------------------------------------------------------
// Deterministic helpers: the same club always gets the same ids and names
// ---------------------------------------------------------------------------

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const INSERT_BATCH_SIZE = 400;

const makeHelpers = (namespace: string) => {
  const digest = (key: string) =>
    crypto.createHash("sha256").update(`${namespace}:${key}`).digest();
  const uuid = (key: string) => {
    const buf = digest(key);
    buf[6] = ((buf[6] ?? 0) & 0x0f) | 0x40;
    buf[8] = ((buf[8] ?? 0) & 0x3f) | 0x80;
    const h = buf.subarray(0, 16).toString("hex");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
  };
  const hash = (key: string) => digest(key).readUInt32BE(0);
  const pick = <T>(items: readonly T[], key: string): T =>
    items[hash(key) % items.length];
  const chance = (key: string, percentage: number) =>
    hash(key) % 100 < percentage;
  return { chance, hash, pick, uuid };
};

const datePlus = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const lastSundayOfMonth = (year: number, monthIndex: number) => {
  const d = new Date(Date.UTC(year, monthIndex + 1, 0));
  return d.getUTCDate() - d.getUTCDay();
};

/** A UK wall-clock time as a Date, accounting for British Summer Time. */
const ukDateTime = (date: string, hour: number, minute = 0) => {
  const [y = 0, m = 1, day = 1] = date.split("-").map(Number);
  const bstStart = Date.UTC(y, 2, lastSundayOfMonth(y, 2), 1);
  const bstEnd = Date.UTC(y, 9, lastSundayOfMonth(y, 9), 1);
  const asUtc = Date.UTC(y, m - 1, day, hour, minute);
  const inBst = asUtc >= bstStart + MS_PER_HOUR && asUtc < bstEnd + MS_PER_HOUR;
  return new Date(asUtc - (inBst ? MS_PER_HOUR : 0));
};

const formatSize = (age: number) => {
  if (age <= 7) {
    return 3;
  }
  if (age <= 9) {
    return 5;
  }
  if (age <= 11) {
    return 7;
  }
  return age <= 13 ? 9 : 11;
};

const matchMinutes = (age: number) => {
  const bands: [number, number][] = [
    [7, 20],
    [9, 40],
    [11, 50],
    [13, 60],
    [14, 70],
    [16, 80],
  ];
  return bands.find(([max]) => age <= max)?.[1] ?? 90;
};

/** Validates every row with its table schema, then inserts in batches. */
const insertRows = async <S extends z.ZodType>(
  db: Tx,
  table: PgTable,
  schema: S,
  items: z.input<S>[],
  label: string
) => {
  if (items.length === 0) {
    return;
  }
  const valid = items.map((item, index) => {
    const result = schema.safeParse(item);
    if (!result.success) {
      throw new Error(
        `${label} row ${index} failed validation: ${result.error.message}\n${JSON.stringify(item)}`
      );
    }
    return result.data;
  });
  for (let offset = 0; offset < valid.length; offset += INSERT_BATCH_SIZE) {
    // The rows were validated against this table's own insert schema above.
    await db
      .insert(table)
      .values(valid.slice(offset, offset + INSERT_BATCH_SIZE) as never)
      .onConflictDoNothing();
  }
  process.stdout.write(`  ${label}: ${valid.length}\n`);
};

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

// [name, age group (null for adults), players, ISO training weekday]
const TEAM_SPECS: readonly [string, number | null, number, number][] = [
  ["Mini Kickers U6", 6, 18, 2],
  ["U7 Comets", 7, 8, 3],
  ["U8 Falcons", 8, 12, 4],
  ["U9 Lions", 9, 14, 2],
  ["U10 Tigers", 10, 14, 3],
  ["U11 Hawks", 11, 15, 4],
  ["U11 Girls", 11, 14, 2],
  ["U12 Wildcats", 12, 18, 3],
  ["U13 Rangers", 13, 18, 4],
  ["U13 Girls", 13, 17, 2],
  ["U14 Blues", 14, 20, 3],
  ["U15 Rovers", 15, 20, 4],
  ["U15 Girls", 15, 18, 2],
  ["U16 United", 16, 20, 3],
  ["U18 Academy", 18, 22, 4],
  ["Women's First Team", null, 21, 2],
  ["Men's First Team", null, 23, 4],
];
const COMPACT_TEAM_INDEXES = [3, 7, 11, 15] as const;

const FIRST_NAMES = [
  "Oliver",
  "Harry",
  "Noah",
  "George",
  "Arthur",
  "Leo",
  "Freddie",
  "Jack",
  "Charlie",
  "Oscar",
  "Archie",
  "Muhammad",
  "Jacob",
  "Henry",
  "Alfie",
  "Thomas",
  "Theo",
  "James",
  "William",
  "Lucas",
  "Ethan",
  "Isaac",
  "Adam",
  "Dylan",
  "Ben",
  "Daniel",
  "Sam",
  "Finley",
  "Reuben",
  "Alex",
  "Amelia",
  "Olivia",
  "Isla",
  "Ava",
  "Mia",
  "Lily",
  "Grace",
  "Ella",
  "Sophie",
  "Freya",
  "Evie",
  "Poppy",
  "Emily",
  "Charlotte",
  "Rosie",
  "Ruby",
  "Jessica",
  "Millie",
  "Ivy",
  "Hannah",
  "Zara",
  "Aisha",
  "Fatima",
  "Niamh",
  "Chloe",
  "Maya",
  "Eliza",
  "Maisie",
  "Florence",
  "Esme",
  "Sienna",
  "Holly",
  "Georgia",
  "Phoebe",
  "Alice",
  "Erin",
  "Joshua",
  "Owen",
  "Max",
  "Joseph",
  "Liam",
  "Mason",
  "Amir",
  "Callum",
  "Elliot",
  "Kai",
  "Nathan",
] as const;
const FEMALE_NAMES = FIRST_NAMES.slice(
  FIRST_NAMES.indexOf("Amelia"),
  FIRST_NAMES.indexOf("Joshua")
);
const SURNAMES = [
  "Taylor",
  "Smith",
  "Jones",
  "Brown",
  "Wilson",
  "Davies",
  "Evans",
  "Thomas",
  "Roberts",
  "Johnson",
  "Walker",
  "White",
  "Thompson",
  "Edwards",
  "Hughes",
  "Green",
  "Lewis",
  "Harris",
  "Clarke",
  "Hall",
  "Martin",
  "Jackson",
  "Wood",
  "Wright",
  "Turner",
  "Hill",
  "Moore",
  "Cooper",
  "Ward",
  "King",
  "Baker",
  "Carter",
  "Phillips",
  "Parker",
  "Morris",
  "Price",
  "Collins",
  "Cook",
  "Reed",
  "Bailey",
  "Khan",
  "Patel",
  "Ali",
  "Ahmed",
  "Singh",
  "O'Connor",
  "Murphy",
  "Walsh",
  "Sullivan",
  "Brooks",
  "Bennett",
  "Foster",
  "Russell",
  "Mitchell",
  "Reynolds",
  "Knight",
  "Cox",
  "Palmer",
  "Pearce",
] as const;
const TOWNS = [
  "Salisbury",
  "Wilton",
  "Amesbury",
  "Downton",
  "Laverstock",
  "Durrington",
  "Fordingbridge",
  "Old Sarum",
  "Broad Chalke",
  "Tisbury",
] as const;
const STREETS = [
  "Oak",
  "Church",
  "Meadow",
  "Willow",
  "High",
  "Mill",
  "Station",
  "Orchard",
  "Victoria",
  "South",
  "Elm",
  "River",
] as const;
const OPPONENT_NAMES = [
  "Amesbury Athletic",
  "Wilton Wanderers",
  "Downton Rovers",
  "Laverstock United",
  "Andover Albion",
  "Romsey Town Juniors",
  "Warminster Whites",
  "Devizes County",
  "Shaftesbury Colts",
  "Tidworth Tigers",
  "Tisbury Lions",
  "Durrington Dynamo",
  "Fordingbridge Falcons",
  "Old Sarum Stars",
  "Winterslow Rangers",
  "Stockbridge Rovers",
  "Ludgershall United",
  "Marlborough Vale",
  "Pewsey Panthers",
  "Blandford United",
  "Porton Rangers",
  "Bemerton Youth",
  "Southampton Vale",
  "Verwood Victoria",
  "Chippenham Juniors",
  "Westbury Wanderers",
  "Melksham Youth",
  "Ringwood Athletic",
  "Wimborne Juniors",
  "Romsey Falcons",
  "Harnham Hornets",
  "Bulford Rovers",
  "Sixpenny Handley FC",
  "Downton Dynamos",
  "Redlynch United",
  "Whiteparish Athletic",
  "Netherhampton Lions",
  "Alderbury Saints",
  "Britford Town",
  "Boscombe Juniors",
] as const;
const VENUE_SPECS = [
  [
    "Vale Sports Ground",
    "Salisbury",
    "SP2 7AA",
    ["grass", "3g"],
    ["training_ground", "match_venue"],
  ],
  ["Vale Training Centre", "Salisbury", "SP1 2BB", ["3g"], ["training_ground"]],
  [
    "Wilton Recreation Fields",
    "Wilton",
    "SP2 0CC",
    ["grass"],
    ["training_ground", "match_venue"],
  ],
  [
    "Amesbury Community Pitches",
    "Amesbury",
    "SP4 7DD",
    ["grass", "3g"],
    ["training_ground", "match_venue"],
  ],
  [
    "Downton Sports Fields",
    "Downton",
    "SP5 3EE",
    ["grass"],
    ["training_ground", "match_venue"],
  ],
  [
    "Five Rivers Winter Training Hall",
    "Salisbury",
    "SP1 3FF",
    ["indoor"],
    ["training_ground", "clubhouse"],
  ],
] as const;
const POSITIONS = [
  "goalkeeper",
  "defender",
  "midfielder",
  "forward",
  "winger",
] as const;
const ANNOUNCEMENT_TITLES = [
  "Weekend fixtures are live",
  "Training cancelled: waterlogged pitch",
  "Kit collection evening",
  "Volunteers needed for clubhouse",
  "Committee update",
  "Fundraising raffle reminder",
  "Half-term football camp",
  "Parent code of conduct reminder",
  "Winter training venue changes",
  "December tournament entries open",
  "Matchday parking guidance",
  "Safeguarding contacts for families",
] as const;
const CONSENT_DOCUMENTS = [
  ["photo_video", "Photography and video consent"],
  ["medical_treatment", "Emergency medical treatment"],
  ["travel", "Team travel and transport"],
  ["data_sharing", "Sharing details with the league"],
  ["social_media", "Club social media"],
] as const;
const FEE_TYPES = [
  ["Registration fee", 2500, 14],
  ["Annual membership", 8000, 44],
  ["Winter training contribution", 3000, 91],
] as const;
const NOTIFICATION_KINDS_USED = [
  "announcement",
  "event_change",
  "event_reminder",
  "consent_request",
  "payment_reminder",
] as const;
const CLUB_ROLES = [
  "admin",
  "secretary",
  "treasurer",
  "welfare_officer",
  "safeguarding_lead",
  "safeguarding_deputy",
  "first_aider",
  "volunteer",
] as const;
const CLUB_ROLE_COUNT = CLUB_ROLES.length;

// ---------------------------------------------------------------------------
// The seed
// ---------------------------------------------------------------------------

interface Context {
  db: Tx;
  options: SeedOptions;
  orgId: string;
  ownerId: string;
}

const today = new Date();
const TODAY = today.toISOString().slice(0, 10);
const SEASON_YEAR =
  today.getUTCMonth() >= 8
    ? today.getUTCFullYear()
    : today.getUTCFullYear() - 1;
const SEASON_START = `${SEASON_YEAR}-09-01`;
const TRAINING_END = `${SEASON_YEAR + 1}-06-30`;
const SEASON_NAME = `${SEASON_YEAR}/${String(SEASON_YEAR + 1).slice(2)}`;
const CREATED = new Date(`${SEASON_YEAR}-09-01T09:00:00.000Z`);
const NOW = new Date();
const AVAILABILITY_WINDOW_DAYS = 28;
const TRAINING_WEEKS = 43;
const MATCH_ROUNDS = 22;
const stamp = () => ({ createdAt: CREATED, updatedAt: NOW });

/** Creates the owner and club the way Better Auth stores them. Returns their ids. */
const createOwnerAndClub = async (
  db: Tx,
  options: SeedOptions,
  uuid: (key: string) => string
) => {
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, options.ownerEmail))
    .limit(1);
  let ownerId = existingUser?.id;
  let reusedAccount = false;
  if (ownerId === undefined) {
    ownerId = uuid("owner");
    await db.insert(users).values({
      createdAt: NOW,
      email: options.ownerEmail,
      emailVerified: true,
      id: ownerId,
      name: options.ownerName,
      updatedAt: NOW,
    });
    await db.insert(accounts).values({
      accountId: ownerId,
      createdAt: NOW,
      id: uuid("owner-account"),
      password: await hashPassword(options.ownerPassword),
      providerId: "credential",
      updatedAt: NOW,
      userId: ownerId,
    });
  } else {
    reusedAccount = true;
    const credentials = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(eq(accounts.userId, ownerId), eq(accounts.providerId, "credential"))
      );
    if (credentials.length === 0) {
      throw new Error(
        `${options.ownerEmail} exists but has no email and password login. Use a different email.`
      );
    }
    // A demo address has no inbox to confirm, and this only runs on a dev database.
    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, ownerId));
  }
  process.stdout.write(
    reusedAccount
      ? `  owner: reusing the existing account for ${options.ownerEmail}\n`
      : `  owner: created ${options.ownerEmail}\n`
  );

  const [existingOrg] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, options.slug))
    .limit(1);
  let orgId = existingOrg?.id;
  if (orgId === undefined) {
    orgId = uuid("organization");
    await db.insert(organizations).values({
      createdAt: NOW,
      id: orgId,
      logo: null,
      metadata: JSON.stringify({ demo: true, season: SEASON_NAME }),
      name: options.clubName,
      slug: options.slug,
    });
    await db.insert(members).values({
      createdAt: NOW,
      id: uuid("owner-member"),
      organizationId: orgId,
      role: "owner",
      userId: ownerId,
    });
  } else {
    const [membership] = await db
      .select({ role: members.role })
      .from(members)
      .where(
        and(eq(members.organizationId, orgId), eq(members.userId, ownerId))
      )
      .limit(1);
    if (membership?.role !== "owner") {
      throw new Error(
        `A club with the slug "${options.slug}" already exists and ${options.ownerEmail} does not own it. Choose another slug.`
      );
    }
  }
  return { orgId, ownerId };
};

const seed = async (ctx: Context, h: ReturnType<typeof makeHelpers>) => {
  const { db, options, orgId: org, ownerId } = ctx;
  const { chance, hash, pick, uuid } = h;
  const clubInitials = options.clubName
    .split(/\s+/u)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 5);
  const specs =
    options.scale === "full"
      ? TEAM_SPECS
      : COMPACT_TEAM_INDEXES.map((i) => TEAM_SPECS[i]);
  const staffCount = options.scale === "full" ? 40 : 12;

  // Seasons, addresses, venues, pitches ------------------------------------
  const seasonId = uuid(`season:${SEASON_NAME}`);
  await insertRows(
    db,
    seasons,
    validation.seasonInsertSchema,
    [-2, -1, 0, 1].map((offset) => {
      const year = SEASON_YEAR + offset;
      const name = `${year}/${String(year + 1).slice(2)}`;
      return {
        endsOn: `${year + 1}-08-31`,
        id: uuid(`season:${name}`),
        isCurrent: offset === 0,
        name,
        organizationId: org,
        startsOn: `${year}-09-01`,
        ...stamp(),
      };
    }),
    "seasons"
  );

  const addressRows: z.input<typeof validation.addressInsertSchema>[] = [];
  const addAddress = (
    key: string,
    line1: string,
    city: string,
    postal: string
  ) => {
    const id = uuid(`address:${key}`);
    addressRows.push({
      city,
      countryCode: "GB",
      id,
      latitude: null,
      line1,
      longitude: null,
      organizationId: org,
      postalCode: postal,
      region: "Wiltshire",
      ...stamp(),
    });
    return id;
  };
  const clubAddress = addAddress(
    "club",
    "1 Vale Ground (fictional)",
    "Salisbury",
    "SP2 7AA"
  );
  const venueAddresses = VENUE_SPECS.map(([, city, postcode], i) =>
    addAddress(
      `venue:${i}`,
      `${i + 1} Community Sports Way (fictional)`,
      city,
      postcode
    )
  );
  const familyCount = options.scale === "full" ? 150 : 45;
  const householdAddresses = Array.from({ length: familyCount }, (_, i) =>
    addAddress(
      `household:${i}`,
      `${i + 4} ${pick(STREETS, `street:${i}`)} Lane`,
      pick(TOWNS, `home-town:${i}`),
      `SP${1 + (i % 5)} ${1 + (i % 9)}${"ABDEFGHJKLMNPQRSTUVWXYZ"[i % 23]}${"ABDEFGHJKLMNPQRSTUVWXYZ"[(i * 7) % 23]}`
    )
  );
  await insertRows(
    db,
    addresses,
    validation.addressInsertSchema,
    addressRows,
    "addresses"
  );

  const venueIds = VENUE_SPECS.map((_, i) => uuid(`venue:${i}`));
  await insertRows(
    db,
    venues,
    validation.venueInsertSchema,
    VENUE_SPECS.map(([name, , , , kinds], i) => ({
      addressId: venueAddresses[i],
      directions: "Fictional venue for development and testing only.",
      id: venueIds[i],
      isActive: true,
      kinds: [...kinds],
      name,
      organizationId: org,
      what3words: null,
      ...stamp(),
    })),
    "venues"
  );
  const pitchRows: z.input<typeof validation.pitchInsertSchema>[] = [];
  VENUE_SPECS.forEach(([, , , surfaces], i) => {
    const formats =
      i === 5 ? (["5v5"] as const) : (["5v5", "7v7", "9v9", "11v11"] as const);
    surfaces.forEach((surface, j) => {
      for (const format of formats) {
        pitchRows.push({
          format,
          id: uuid(`pitch:${i}:${j}:${format}`),
          isActive: true,
          name: `${format} ${surface.toUpperCase()} ${j + 1}`,
          organizationId: org,
          surface,
          venueId: venueIds[i],
          ...stamp(),
        });
      }
    });
  });
  await insertRows(
    db,
    pitches,
    validation.pitchInsertSchema,
    pitchRows,
    "pitches"
  );
  await insertRows(
    db,
    clubSettings,
    validation.clubSettingsInsertSchema,
    [
      {
        addressId: clubAddress,
        contactEmail: `club@${options.slug}.example.com`,
        contactPhone: "07700 900999",
        homeVenueId: venueIds[0],
        organizationId: org,
        shortName: options.clubName.replace(/\s+(FC|AFC)$/u, ""),
        website: `https://${options.slug}.example.com`,
        ...stamp(),
      },
    ],
    "club settings"
  );

  // Teams ---------------------------------------------------------------------
  const teamIds = specs.map((_, i) => uuid(`team:${i}`));
  await insertRows(
    db,
    teams,
    validation.teamInsertSchema,
    specs.map(([name, age], i) => ({
      ageGroup: age,
      id: teamIds[i],
      isActive: true,
      name,
      organizationId: org,
      seasonId,
      trainingVenueId: venueIds[i % 2],
      ...stamp(),
    })),
    "teams"
  );

  // Families, players ---------------------------------------------------------
  const personRows: z.input<typeof validation.personInsertSchema>[] = [];
  const relationshipRows: z.input<
    typeof validation.personRelationshipInsertSchema
  >[] = [];
  const profileRows: z.input<typeof validation.playerProfileInsertSchema>[] =
    [];
  const membershipRows: z.input<
    typeof validation.teamMembershipInsertSchema
  >[] = [];
  const registrationRows: z.input<
    typeof validation.registrationInsertSchema
  >[] = [];
  const identifierRows: z.input<
    typeof validation.personIdentifierInsertSchema
  >[] = [];
  const families = householdAddresses.map((address, i) => ({
    address,
    parentIds: [] as string[],
    surname: pick(SURNAMES, `family-name:${i}`),
  }));
  families.forEach((family, i) => {
    const parentCount = chance(`parent-second:${i}`, 72) ? 2 : 1;
    for (let k = 0; k < parentCount; k++) {
      const id = uuid(`parent:${i}:${k}`);
      personRows.push({
        addressId: family.address,
        dateOfBirth: `${1969 + (hash(`parent-year:${i}:${k}`) % 22)}-${String(1 + (i % 12)).padStart(2, "0")}-15`,
        email: `guardian-${i + 1}-${k + 1}@example.com`,
        firstName: pick(FIRST_NAMES, `parent-fn:${i}:${k}`),
        id,
        isActive: true,
        lastName: family.surname,
        organizationId: org,
        phone: `07700 900${String(i * 2 + k).padStart(3, "0")}`,
        preferredName: null,
        ...stamp(),
      });
      family.parentIds.push(id);
    }
  });

  interface Player {
    age: number | null;
    id: string;
    shirt: number;
  }
  const playersByTeam: Player[][] = specs.map(() => []);
  const guardianForPlayer = new Map<string, string>();
  const teamForPlayer = new Map<string, string>();
  let playerIndex = 0;
  specs.forEach(([teamName, age, count], teamIndex) => {
    for (let i = 0; i < count; i++) {
      const id = uuid(`player:${teamIndex}:${i}`);
      const family = families[playerIndex % families.length];
      if (family === undefined) {
        throw new Error("No families to attach players to.");
      }
      const female =
        teamName.includes("Girls") || teamName.startsWith("Women's");
      const month = 1 + (i % 12);
      const dateOfBirth =
        age === null
          ? `${1986 + (hash(`adult-year:${teamIndex}:${i}`) % 21)}-${String(month).padStart(2, "0")}-${String(1 + (i % 28)).padStart(2, "0")}`
          : `${month >= 9 ? SEASON_YEAR - age : SEASON_YEAR + 1 - age}-${String(month).padStart(2, "0")}-${String(1 + (i % 27)).padStart(2, "0")}`;
      personRows.push({
        addressId: family.address,
        dateOfBirth,
        email: age === null ? `player-${teamIndex}-${i}@example.com` : null,
        firstName: pick(
          female ? FEMALE_NAMES : FIRST_NAMES,
          `player-name:${teamIndex}:${i}:${female ? "g" : "any"}`
        ),
        id,
        isActive: true,
        lastName: family.surname,
        organizationId: org,
        phone:
          age === null
            ? `07700 900${String(700 + playerIndex).padStart(3, "0")}`
            : null,
        preferredName: null,
        ...stamp(),
      });
      guardianForPlayer.set(id, family.parentIds[0]);
      teamForPlayer.set(id, teamIds[teamIndex]);
      if (age !== null) {
        family.parentIds.forEach((parentId, k) =>
          relationshipRows.push({
            canCollect: true,
            hasParentalResponsibility: true,
            id: uuid(`relation:${id}:${parentId}`),
            isEmergencyContact: true,
            organizationId: org,
            personId: id,
            relatedPersonId: parentId,
            relationship: k === 0 ? "parent" : "guardian",
            ...stamp(),
          })
        );
      }
      profileRows.push({
        heightCm: age === null ? 160 + (hash(`height:${id}`) % 37) : null,
        organizationId: org,
        personId: id,
        preferredFoot: chance(`foot:${id}`, 74) ? "right" : "left",
        primaryPosition: pick(POSITIONS, `pos:${id}`),
        secondaryPosition: pick(POSITIONS.slice(1), `second:${id}`),
        ...stamp(),
      });
      membershipRows.push({
        endsOn: null,
        id: uuid(`membership:${id}`),
        organizationId: org,
        personId: id,
        role: "player",
        shirtNumber: i + 1,
        startsOn: SEASON_START,
        teamId: teamIds[teamIndex],
        ...stamp(),
      });
      registrationRows.push({
        id: uuid(`registration:${id}`),
        organizationId: org,
        personId: id,
        registeredOn: `${SEASON_YEAR}-08-21`,
        seasonId,
        status: chance(`reg-pending:${id}`, 8) ? "pending" : "active",
        teamId: teamIds[teamIndex],
        withdrawnOn: null,
        ...stamp(),
      });
      identifierRows.push({
        id: uuid(`identifier:${id}`),
        organizationId: org,
        personId: id,
        type: "league_registration",
        value: `${clubInitials}-${String(playerIndex + 1).padStart(5, "0")}`,
        ...stamp(),
      });
      playersByTeam[teamIndex]?.push({ age, id, shirt: i + 1 });
      playerIndex++;
    }
  });
  const allPlayers = playersByTeam.flat();

  // Staff: logins without passwords, so they appear in the UI but cannot sign in --------
  const staffUserRows: (typeof users.$inferInsert)[] = [];
  const staffMemberRows: (typeof members.$inferInsert)[] = [];
  const staffPeople: z.input<typeof validation.personInsertSchema>[] = [];
  for (let i = 0; i < staffCount; i++) {
    const userId = uuid(`staff-user:${i}`);
    const first = pick(FIRST_NAMES, `staff-fn:${i}`);
    const last = pick(SURNAMES, `staff-ln:${i}`);
    const email = `${options.slug}-staff-${i + 1}@example.com`;
    staffUserRows.push({
      createdAt: CREATED,
      email,
      emailVerified: true,
      id: userId,
      name: `${first} ${last}`,
      updatedAt: NOW,
    });
    staffMemberRows.push({
      createdAt: CREATED,
      id: uuid(`staff-org-member:${i}`),
      organizationId: org,
      role: i < 2 ? "admin" : "member",
      userId,
    });
    staffPeople.push({
      dateOfBirth: `${1975 + (i % 20)}-06-10`,
      email,
      firstName: first,
      id: uuid(`staff-person:${i}`),
      isActive: true,
      lastName: last,
      organizationId: org,
      phone: `07700 900${String(600 + i).padStart(3, "0")}`,
      preferredName: null,
      userId,
      ...stamp(),
    });
  }
  await db.insert(users).values(staffUserRows).onConflictDoNothing();
  await db.insert(members).values(staffMemberRows).onConflictDoNothing();
  process.stdout.write(`  staff logins: ${staffCount}\n`);

  await insertRows(
    db,
    people,
    validation.personInsertSchema,
    [...personRows, ...staffPeople],
    "people"
  );
  await insertRows(
    db,
    personRelationships,
    validation.personRelationshipInsertSchema,
    relationshipRows,
    "relationships"
  );
  await insertRows(
    db,
    playerProfiles,
    validation.playerProfileInsertSchema,
    profileRows,
    "player profiles"
  );
  await insertRows(
    db,
    registrations,
    validation.registrationInsertSchema,
    registrationRows,
    "registrations"
  );
  await insertRows(
    db,
    personIdentifiers,
    validation.personIdentifierInsertSchema,
    identifierRows,
    "identifiers"
  );

  // Staff roles (club-wide first, then one coach per team, then team managers) ----------
  const assignmentRows: z.input<
    typeof validation.roleAssignmentInsertSchema
  >[] = [];
  const assignmentTeamRows: z.input<
    typeof validation.roleAssignmentTeamInsertSchema
  >[] = [];
  const coachEnd = CLUB_ROLE_COUNT + specs.length;
  staffUserRows.forEach((user, i) => {
    const userId = user.id as string;
    const clubRole: (typeof CLUB_ROLES)[number] | undefined = CLUB_ROLES[i];
    const role: RoleAssignmentRole =
      clubRole ?? (i < coachEnd ? "coach" : "team_manager");
    const id = uuid(`role:staff:${i}`);
    assignmentRows.push({
      grantedBy: ownerId,
      id,
      organizationId: org,
      role,
      scope: clubRole === undefined ? "teams" : "organization",
      startsAt: CREATED,
      userId,
      ...stamp(),
    });
    if (clubRole === undefined) {
      const teamIndex = (i - CLUB_ROLE_COUNT) % specs.length;
      assignmentTeamRows.push({
        createdAt: CREATED,
        organizationId: org,
        roleAssignmentId: id,
        teamId: teamIds[teamIndex],
      });
      membershipRows.push({
        endsOn: null,
        id: uuid(`coach-membership:${i}`),
        organizationId: org,
        personId: uuid(`staff-person:${i}`),
        role: i < coachEnd ? "coach" : "manager",
        shirtNumber: null,
        startsOn: SEASON_START,
        teamId: teamIds[teamIndex],
        ...stamp(),
      });
    }
  });
  await insertRows(
    db,
    teamMemberships,
    validation.teamMembershipInsertSchema,
    membershipRows,
    "team memberships"
  );
  await insertRows(
    db,
    roleAssignments,
    validation.roleAssignmentInsertSchema,
    assignmentRows,
    "role assignments"
  );
  await insertRows(
    db,
    roleAssignmentTeams,
    validation.roleAssignmentTeamInsertSchema,
    assignmentTeamRows,
    "role assignment teams"
  );

  // Opponents -------------------------------------------------------------------
  const opponentIds = OPPONENT_NAMES.map((_, i) => uuid(`opponent:${i}`));
  await insertRows(
    db,
    opponents,
    validation.opponentInsertSchema,
    OPPONENT_NAMES.map((name, i) => ({
      contactEmail: `opposition-${i + 1}@example.com`,
      id: opponentIds[i],
      isActive: i < 37,
      name,
      organizationId: org,
      shortName: name.split(" ").slice(0, 2).join(" "),
      website: null,
      ...stamp(),
    })),
    "opponents"
  );

  // Training series, training and matches ---------------------------------------
  const seriesRows: z.input<typeof validation.eventSeriesInsertSchema>[] = [];
  const eventRows: z.input<typeof validation.eventInsertSchema>[] = [];
  const detailRows: z.input<typeof validation.matchDetailInsertSchema>[] = [];
  const squadRows: z.input<typeof validation.matchSquadInsertSchema>[] = [];
  const availabilityRows: z.input<
    typeof validation.eventAvailabilityInsertSchema
  >[] = [];
  const attendanceRows: z.input<
    typeof validation.eventAttendanceInsertSchema
  >[] = [];
  const availabilityCutoff = datePlus(TODAY, AVAILABILITY_WINDOW_DAYS);

  specs.forEach(([teamName, age, , weekday], t) => {
    const teamId = teamIds[t];
    const roster = playersByTeam[t] ?? [];
    const trainingHour = age === null ? 19 : age >= 15 ? 18 : 17;
    const isLong = age === null || age >= 18;
    const trainingVenue = venueIds[t % 2];
    const seriesId = uuid(`training-series:${t}`);
    seriesRows.push({
      createdByUserId: ownerId,
      description: `Skills, small-sided practice and team development for ${teamName}.`,
      durationMinutes: isLong ? 90 : 60,
      endsOn: TRAINING_END,
      generatedUntil: TRAINING_END,
      id: seriesId,
      intervalWeeks: 1,
      isActive: true,
      kind: "training",
      meetMinutesBefore: 10,
      organizationId: org,
      startTime: `${String(trainingHour).padStart(2, "0")}:30:00`,
      startsOn: SEASON_START,
      teamId,
      timeZone: "Europe/London",
      title: `${teamName} weekly training`,
      venueId: trainingVenue,
      weekday,
      ...stamp(),
    });
    for (let week = 0; week < TRAINING_WEEKS; week++) {
      const weekStart = datePlus(SEASON_START, week * 7);
      const dayOfWeek = new Date(`${weekStart}T12:00:00Z`).getUTCDay();
      const date = datePlus(weekStart, (weekday - dayOfWeek + 7) % 7);
      if (date > TRAINING_END) {
        continue;
      }
      const starts = ukDateTime(date, trainingHour, 30);
      const cancelled = chance(`training-cancel:${t}:${week}`, 5);
      const past = date < TODAY;
      const eventId = uuid(`training-event:${t}:${week}`);
      eventRows.push({
        cancellationReason: cancelled ? "Waterlogged pitch" : null,
        createdByUserId: ownerId,
        description: cancelled
          ? "Session cancelled due to poor pitch conditions."
          : "Warm-up, ball mastery, teamwork and small-sided games.",
        endsAt: new Date(starts.getTime() + (isLong ? 90 : 60) * MS_PER_MINUTE),
        id: eventId,
        kind: "training",
        organizationId: org,
        seriesId,
        seriesOccurrenceStartsAt: starts,
        startsAt: starts,
        status: cancelled ? "cancelled" : past ? "completed" : "scheduled",
        teamId,
        title: `${teamName} training`,
        venueId: trainingVenue,
        ...stamp(),
      });
      if (cancelled || date > availabilityCutoff) {
        continue;
      }
      roster.forEach((p, i) => {
        const absent = chance(`training-avail:${eventId}:${p.id}`, 15);
        availabilityRows.push({
          eventId,
          id: uuid(`avail:${eventId}:${p.id}`),
          note: absent && i % 3 === 0 ? "Family commitment" : null,
          organizationId: org,
          personId: p.id,
          respondedAt: ukDateTime(datePlus(date, -2), 18),
          status: absent ? "unavailable" : "available",
          ...stamp(),
        });
        if (past) {
          const late = !absent && chance(`training-late:${eventId}:${p.id}`, 8);
          attendanceRows.push({
            eventId,
            id: uuid(`attend:${eventId}:${p.id}`),
            organizationId: org,
            personId: p.id,
            recordedByUserId: ownerId,
            status: absent
              ? chance(`training-excused:${eventId}:${p.id}`, 25)
                ? "excused"
                : "absent"
              : late
                ? "late"
                : "present",
            ...stamp(),
          });
        }
      });
    }

    if (!options.includeMatches || age === 6) {
      return; // The youngest group trains but plays no organised matches.
    }
    const duration = matchMinutes(age ?? 18);
    const starters = Math.min(
      roster.length,
      formatSize(age ?? 18) === 3 ? 3 : formatSize(age ?? 18)
    );
    const firstSaturday = (() => {
      const base = datePlus(SEASON_START, 4);
      const dow = new Date(`${base}T12:00:00Z`).getUTCDay();
      return datePlus(base, (6 - dow + 7) % 7);
    })();
    for (let round = 0; round < MATCH_ROUNDS; round++) {
      const date = datePlus(firstSaturday, round * 14 + (t % 3) * 7);
      if (date > TRAINING_END) {
        continue;
      }
      const past = date < TODAY;
      const home = round % 2 === 0;
      const opponentIndex = (t * 4 + round * 3) % OPPONENT_NAMES.length;
      const opponentName = OPPONENT_NAMES[opponentIndex] as string;
      const start = ukDateTime(
        date,
        age === null || age >= 18 ? 14 : 10,
        round % 2 ? 30 : 0
      );
      const cancelled = chance(`match-cancel:${t}:${round}`, 5);
      const eventId = uuid(`match-event:${t}:${round}`);
      const scored = past && !cancelled;
      const goalsFor = scored ? hash(`gf:${t}:${round}`) % 6 : null;
      eventRows.push({
        cancellationReason: cancelled ? "Pitch inspection: waterlogged" : null,
        createdByUserId: ownerId,
        description: `${home ? "Home" : "Away"} fixture against ${opponentName}. Please confirm availability.`,
        endsAt: new Date(start.getTime() + duration * MS_PER_MINUTE),
        id: eventId,
        kind: "match",
        meetAt: new Date(start.getTime() - 35 * MS_PER_MINUTE),
        organizationId: org,
        startsAt: start,
        status: cancelled ? "cancelled" : past ? "completed" : "scheduled",
        teamId,
        title: `${teamName} ${home ? "vs" : "at"} ${opponentName}`,
        venueId: home ? venueIds[0] : null,
        ...stamp(),
      });
      detailRows.push({
        competition:
          age === null || age >= 16
            ? "Wiltshire Football League (fictional)"
            : "Wiltshire Youth League (fictional)",
        eventId,
        goalsAgainst: scored ? hash(`ga:${t}:${round}`) % 5 : null,
        goalsFor,
        homeAway: home ? "home" : "away",
        opponentId: opponentIds[opponentIndex],
        organizationId: org,
        ...stamp(),
      });
      if (cancelled) {
        continue;
      }
      const eligible = roster.filter(
        (p, i) => i === 0 || !chance(`match-unavailable:${eventId}:${p.id}`, 12)
      );
      const scorers = Array.from(
        { length: goalsFor ?? 0 },
        (_, g) => eligible[hash(`scorer:${eventId}:${g}`) % eligible.length]?.id
      );
      roster.forEach((p, i) => {
        const available = eligible.some((candidate) => candidate.id === p.id);
        if (date <= availabilityCutoff) {
          availabilityRows.push({
            eventId,
            id: uuid(`avail:${eventId}:${p.id}`),
            organizationId: org,
            personId: p.id,
            respondedAt: ukDateTime(datePlus(date, -3), 18),
            status: available ? "available" : "unavailable",
            ...stamp(),
          });
        }
        if (!past) {
          return;
        }
        attendanceRows.push({
          eventId,
          id: uuid(`attend:${eventId}:${p.id}`),
          organizationId: org,
          personId: p.id,
          recordedByUserId: ownerId,
          status: available ? "present" : "absent",
          ...stamp(),
        });
        if (available) {
          squadRows.push({
            eventId,
            goals: scorers.filter((id) => id === p.id).length,
            id: uuid(`squad:${eventId}:${p.id}`),
            minutesPlayed: i < starters ? duration : Math.floor(duration / 3),
            organizationId: org,
            personId: p.id,
            position: pick(POSITIONS, `match-pos:${eventId}:${p.id}`),
            role: i < starters ? "starter" : "substitute",
            shirtNumber: p.shirt,
            ...stamp(),
          });
        }
      });
    }
  });
  await insertRows(
    db,
    eventSeries,
    validation.eventSeriesInsertSchema,
    seriesRows,
    "event series"
  );
  await insertRows(
    db,
    events,
    validation.eventInsertSchema,
    eventRows,
    "events"
  );
  await insertRows(
    db,
    matchDetails,
    validation.matchDetailInsertSchema,
    detailRows,
    "match details"
  );
  await insertRows(
    db,
    matchSquad,
    validation.matchSquadInsertSchema,
    squadRows,
    "match squads"
  );
  await insertRows(
    db,
    eventAvailability,
    validation.eventAvailabilityInsertSchema,
    availabilityRows,
    "availability"
  );
  await insertRows(
    db,
    eventAttendance,
    validation.eventAttendanceInsertSchema,
    attendanceRows,
    "attendance"
  );

  // Fees ----------------------------------------------------------------------------
  if (options.includeFinance) {
    const feeRows: z.input<typeof validation.feeInsertSchema>[] = [];
    const chargeRows: z.input<typeof validation.feeChargeInsertSchema>[] = [];
    const paymentRows: z.input<typeof validation.paymentInsertSchema>[] = [];
    specs.forEach(([teamName], t) => {
      for (const [type, amount, dueInDays] of FEE_TYPES) {
        const feeId = uuid(`fee:${t}:${type}`);
        const dueOn = datePlus(SEASON_START, dueInDays);
        feeRows.push({
          amountMinor: amount,
          currency: "GBP",
          description: `${SEASON_NAME} ${type.toLowerCase()}`,
          dueOn,
          id: feeId,
          isActive: true,
          name: `${teamName}: ${type}`,
          organizationId: org,
          seasonId,
          teamId: teamIds[t],
          ...stamp(),
        });
        for (const p of playersByTeam[t] ?? []) {
          const roll = hash(`payment-state:${p.id}:${type}`) % 100;
          const kind =
            roll < 61
              ? "paid"
              : roll < 77
                ? "part"
                : roll < 91
                  ? "unpaid"
                  : "waived";
          const chargeId = uuid(`charge:${feeId}:${p.id}`);
          chargeRows.push({
            amountMinor: amount,
            currency: "GBP",
            dueOn,
            feeId,
            id: chargeId,
            organizationId: org,
            personId: p.id,
            status:
              kind === "paid" ? "paid" : kind === "waived" ? "waived" : "due",
            waivedReason: kind === "waived" ? "Club hardship fund" : null,
            ...stamp(),
          });
          if (kind === "paid" || kind === "part") {
            paymentRows.push({
              amountMinor: kind === "paid" ? amount : Math.floor(amount / 2),
              chargeId,
              createdAt: NOW,
              currency: "GBP",
              id: uuid(`payment:${chargeId}`),
              method: pick(
                ["bank_transfer", "cash", "card"] as const,
                `method:${p.id}:${type}`
              ),
              organizationId: org,
              receivedAt: ukDateTime(
                datePlus(dueOn, -(hash(`paid-day:${p.id}:${type}`) % 12)),
                12
              ),
              recordedByUserId: ownerId,
              reference: `${clubInitials}-${chargeId.slice(0, 8)}`,
            });
          }
        }
      }
    });
    await insertRows(db, fees, validation.feeInsertSchema, feeRows, "fees");
    await insertRows(
      db,
      feeCharges,
      validation.feeChargeInsertSchema,
      chargeRows,
      "fee charges"
    );
    await insertRows(
      db,
      payments,
      validation.paymentInsertSchema,
      paymentRows,
      "payments"
    );
  }

  // Consents, medical, safeguarding, incidents -------------------------------------
  if (options.includeWelfare) {
    await insertRows(
      db,
      consentDocuments,
      validation.consentDocumentInsertSchema,
      CONSENT_DOCUMENTS.map(([type, title]) => ({
        body: `${title}: synthetic demonstration policy. No legal effect.`,
        id: uuid(`consent-doc:${type}`),
        organizationId: org,
        publishedAt: new Date(`${SEASON_YEAR}-08-15T12:00:00.000Z`),
        title,
        type,
        version: 1,
        ...stamp(),
      })),
      "consent documents"
    );
    const consentRows: z.input<typeof validation.consentInsertSchema>[] = [];
    specs.forEach(([, age], t) => {
      for (const p of playersByTeam[t] ?? []) {
        for (const [type] of CONSENT_DOCUMENTS) {
          if (chance(`missing-consent:${p.id}:${type}`, 14)) {
            continue;
          }
          const grantedAt = new Date(`${SEASON_YEAR}-08-23T10:00:00.000Z`);
          consentRows.push({
            documentId: uuid(`consent-doc:${type}`),
            grantedAt,
            grantedByPersonId:
              age === null ? null : (guardianForPlayer.get(p.id) ?? null),
            id: uuid(`consent:${p.id}:${type}`),
            organizationId: org,
            personId: p.id,
            type,
            withdrawnAt: chance(`withdraw-consent:${p.id}:${type}`, 3)
              ? new Date(`${SEASON_YEAR}-10-03T12:00:00.000Z`)
              : null,
            ...stamp(),
          });
        }
      }
    });
    await insertRows(
      db,
      consents,
      validation.consentInsertSchema,
      consentRows,
      "consents"
    );

    const medicalRows: z.input<typeof validation.medicalRecordInsertSchema>[] =
      [];
    const allergyRows: z.input<typeof validation.allergyInsertSchema>[] = [];
    allPlayers.forEach((p, i) => {
      if (i % 21 === 0) {
        medicalRows.push({
          details:
            "Synthetic development-only record. Inhaler kept with parent or team first aider.",
          emergencyNotes: "Follow synthetic club care-plan workflow.",
          endedOn: null,
          id: uuid(`med:${p.id}`),
          isEmergencyRelevant: true,
          kind: "condition",
          name: "Exercise-induced asthma (fictional)",
          organizationId: org,
          personId: p.id,
          startedOn: `${SEASON_YEAR - 2}-06-01`,
          ...stamp(),
        });
      }
      if (i % 33 === 0) {
        allergyRows.push({
          allergen: "Grass pollen (fictional)",
          id: uuid(`allergy:${p.id}`),
          organizationId: org,
          personId: p.id,
          reaction: "Hay fever symptoms",
          severity: "mild",
          treatment: "Use family-provided care plan",
          ...stamp(),
        });
      }
    });
    await insertRows(
      db,
      medicalRecords,
      validation.medicalRecordInsertSchema,
      medicalRows,
      "medical records"
    );
    await insertRows(
      db,
      allergies,
      validation.allergyInsertSchema,
      allergyRows,
      "allergies"
    );

    const qualificationRows: z.input<
      typeof validation.qualificationInsertSchema
    >[] = [];
    const checkRows: z.input<
      typeof validation.safeguardingCheckInsertSchema
    >[] = [];
    staffPeople.forEach((person, i) => {
      const personId = person.id as string;
      if (i % 2 === 0) {
        qualificationRows.push({
          awardedBy: "Fictional training record",
          expiresOn: null,
          id: uuid(`qual:${i}`),
          issuedOn: datePlus(TODAY, -600),
          kind: "coaching",
          organizationId: org,
          personId,
          reference: `DEMO-QUAL-${i + 1}`,
          title:
            i % 3 === 0
              ? "Introduction to Coaching Football"
              : "UEFA C Coaching Award",
          ...stamp(),
        });
      }
      if (i % 3 === 0) {
        qualificationRows.push({
          awardedBy: "Demo training provider",
          expiresOn: i % 2 === 0 ? datePlus(TODAY, 700) : datePlus(TODAY, -30),
          id: uuid(`first-aid:${i}`),
          issuedOn: datePlus(TODAY, -760),
          kind: "first_aid",
          organizationId: org,
          personId,
          reference: `DEMO-FA-${i + 1}`,
          title: "Emergency First Aid in Football",
          ...stamp(),
        });
      }
      const pending = i % 7 === 0;
      checkRows.push({
        dbsLevel: "enhanced",
        dbsUpdateService: i % 3 === 0,
        expiresOn: i % 9 === 0 ? datePlus(TODAY, -20) : null,
        id: uuid(`safeguarding-check:${i}`),
        issuedOn: datePlus(TODAY, -1100),
        kind: "dbs",
        organizationId: org,
        personId,
        reference: `SYNTHETIC-DBS-${String(i + 1).padStart(3, "0")}`,
        status: pending ? "pending" : "valid",
        verifiedAt: pending
          ? null
          : new Date(`${SEASON_YEAR}-08-20T12:00:00.000Z`),
        verifiedBy: pending ? null : ownerId,
        ...stamp(),
      });
      if (i % 2 === 0) {
        checkRows.push({
          dbsLevel: null,
          dbsUpdateService: false,
          expiresOn: null,
          id: uuid(`safeguarding-training:${i}`),
          issuedOn: datePlus(TODAY, -300),
          kind: "safeguarding_training",
          organizationId: org,
          personId,
          reference: `SYNTHETIC-SGT-${String(i + 1).padStart(3, "0")}`,
          status: "valid",
          verifiedAt: new Date(`${SEASON_YEAR}-08-20T12:00:00.000Z`),
          verifiedBy: ownerId,
          ...stamp(),
        });
      }
    });
    await insertRows(
      db,
      qualifications,
      validation.qualificationInsertSchema,
      qualificationRows,
      "qualifications"
    );
    await insertRows(
      db,
      safeguardingChecks,
      validation.safeguardingCheckInsertSchema,
      checkRows,
      "safeguarding checks"
    );

    const incidentRows: z.input<
      typeof validation.incidentReportInsertSchema
    >[] = [];
    for (let i = 0; i < 8; i++) {
      const p = allPlayers[(i * 32) % allPlayers.length];
      const day = datePlus(SEASON_START, 40 + i * 3);
      incidentRows.push({
        actionTaken:
          "Assessed by the fictional club first aider and parent advised.",
        description:
          "Synthetic training incident: player stumbled during a drill; staff checked for injury.",
        firstAiderPersonId: staffPeople[6]?.id,
        followUpRequired: i % 3 === 0,
        id: uuid(`incident:${i}`),
        kind: i % 2 ? "near_miss" : "injury",
        occurredAt: ukDateTime(day, 17, 45),
        organizationId: org,
        parentsNotifiedAt: ukDateTime(day, 18, 15),
        personId: p.id,
        reportedBy: ownerId,
        severity: "minor",
        teamId: teamForPlayer.get(p.id) ?? null,
        venueId: venueIds[0],
        ...stamp(),
      });
    }
    await insertRows(
      db,
      incidentReports,
      validation.incidentReportInsertSchema,
      incidentRows,
      "incident reports"
    );

    // Concern details and notes are encrypted by the app, so they are encrypted here too.
    const safeguardingKey = process.env.SAFEGUARDING_KEY;
    if (safeguardingKey === undefined || safeguardingKey === "") {
      process.stdout.write(
        "  safeguarding concerns: skipped (SAFEGUARDING_KEY is not set)\n"
      );
    } else {
      const encryptor = createFieldEncryptor({
        activeKeyId: "k1",
        keys: { k1: keyFromBase64(safeguardingKey) },
      });
      const concernRows: z.input<
        typeof validation.safeguardingConcernInsertSchema
      >[] = [];
      const noteRows: z.input<
        typeof validation.safeguardingNoteInsertSchema
      >[] = [];
      for (let i = 0; i < 4; i++) {
        const p = allPlayers[(i * 49) % allPlayers.length];
        const id = uuid(`safeguarding-concern:${i}`);
        const noteId = uuid(`safeguarding-note:${i}`);
        const closed = i % 2 === 1;
        concernRows.push({
          assignedTo: staffUserRows[4]?.id,
          closedAt: closed
            ? new Date(`${SEASON_YEAR}-10-09T10:00:00.000Z`)
            : null,
          closedReason: closed ? "Closed synthetic demonstration record" : null,
          details: encryptor.encrypt(
            "Fictional administrative safeguarding workflow test. No actual allegation or identifiable individual.",
            id
          ),
          id,
          openedAt: new Date(
            `${SEASON_YEAR}-09-${String(11 + i).padStart(2, "0")}T10:00:00.000Z`
          ),
          organizationId: org,
          raisedBy: ownerId,
          severity: "low",
          status: closed ? "closed" : "open",
          subjectPersonId: p.id,
          summary: "SYNTHETIC TEST: restricted workflow demonstration",
          ...stamp(),
        });
        noteRows.push({
          authorUserId: ownerId,
          body: encryptor.encrypt(
            "SYNTHETIC TEST ONLY: safeguarding permission and audit-flow sample.",
            noteId
          ),
          concernId: id,
          createdAt: NOW,
          id: noteId,
          organizationId: org,
        });
      }
      await insertRows(
        db,
        safeguardingConcerns,
        validation.safeguardingConcernInsertSchema,
        concernRows,
        "safeguarding concerns"
      );
      await insertRows(
        db,
        safeguardingNotes,
        validation.safeguardingNoteInsertSchema,
        noteRows,
        "safeguarding notes"
      );
    }
  }

  // Communications, onboarding, audit -------------------------------------------------
  await insertRows(
    db,
    announcements,
    validation.announcementInsertSchema,
    Array.from({ length: 75 }, (_, i) => {
      const title = ANNOUNCEMENT_TITLES[
        i % ANNOUNCEMENT_TITLES.length
      ] as string;
      const posted = datePlus(SEASON_START, i * 2);
      return {
        authorUserId: ownerId,
        body: `${title}. This is fictional club communication data for the Huddle Kit development environment. Please check your team page for the latest details.`,
        expiresAt: i % 8 === 0 ? ukDateTime(datePlus(posted, 14), 23) : null,
        id: uuid(`announcement:${i}`),
        organizationId: org,
        publishedAt: ukDateTime(posted, 9),
        teamId: i % 4 === 0 ? teamIds[i % teamIds.length] : null,
        title,
        ...stamp(),
      };
    }),
    "announcements"
  );
  await insertRows(
    db,
    notifications,
    validation.notificationInsertSchema,
    Array.from({ length: 115 }, (_, i) => ({
      body: "Demo notification generated for development and testing.",
      createdAt: ukDateTime(datePlus(SEASON_START, i), 9),
      id: uuid(`notification:${i}`),
      kind: pick(NOTIFICATION_KINDS_USED, `notification-kind:${i}`),
      organizationId: org,
      readAt: i % 3 === 0 ? NOW : null,
      title: ANNOUNCEMENT_TITLES[i % ANNOUNCEMENT_TITLES.length] as string,
      userId: ownerId,
    })),
    "notifications"
  );
  const clubSteps = [
    "club",
    "location",
    "governance",
    "schedule",
    "fees",
    "social",
    "team",
  ] as const;
  const userSteps = ["you", "emergency", "safeguarding"] as const;
  await insertRows(
    db,
    onboardingSteps,
    validation.onboardingStepInsertSchema,
    [
      ...clubSteps.map((step, i) => ({
        completedAt: new Date(
          `${SEASON_YEAR}-08-${String(21 + (i % 3)).padStart(2, "0")}T12:00:00.000Z`
        ),
        completedBy: ownerId,
        id: uuid(`onboard-club:${step}`),
        organizationId: org,
        step,
      })),
      ...userSteps.map((step, i) => ({
        completedAt: new Date(
          `${SEASON_YEAR}-08-${String(21 + i).padStart(2, "0")}T12:00:00.000Z`
        ),
        id: uuid(`onboard-user:${step}`),
        step,
        userId: ownerId,
      })),
    ],
    "onboarding steps"
  );
  await insertRows(
    db,
    auditEvents,
    validation.auditEventInsertSchema,
    Array.from({ length: 100 }, (_, i) => ({
      action: pick(
        ["team.create", "team.update", "event.create", "event.update"] as const,
        `audit-action:${i}`
      ),
      actorUserId: ownerId,
      entityId: i % 2 ? teamIds[i % teamIds.length] : uuid(`audit-entity:${i}`),
      entityType: i % 2 ? "team" : "event",
      id: uuid(`audit:${i}`),
      metadata: { fixtureVersion: 1, synthetic: true },
      occurredAt: ukDateTime(datePlus(SEASON_START, i), 12),
      organizationId: org,
      userAgent: "HuddleKit demo seeder",
    })),
    "audit events"
  );

  return { players: allPlayers.length, teams: specs.length };
};

const main = async () => {
  const interactive = process.stdin.isTTY && !process.argv.includes("--yes");
  const options = interactive ? await askQuestions() : defaultOptions();

  if (
    !["development", "test"].includes(process.env.NODE_ENV ?? "development")
  ) {
    throw new Error("Refusing to seed: NODE_ENV must be development or test.");
  }
  const { DATABASE_URL: url } = keys();
  const { hostname, pathname } = new URL(url);
  const localHosts = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
  if (!localHosts.has(hostname) && process.env.ALLOW_REMOTE_SEED !== "yes") {
    throw new Error(
      `Refusing to seed "${hostname}": it is not a local database. Set ALLOW_REMOTE_SEED=yes only for a throwaway dev database.`
    );
  }
  if (/prod/iu.test(pathname)) {
    throw new Error(
      `Database "${pathname.slice(1)}" looks like production. Aborting.`
    );
  }

  const db = createDatabase({
    pool: { max: 2, statementTimeoutMs: 120_000 },
    url,
  });
  const h = makeHelpers(`huddlekit-demo:${options.slug}`);
  try {
    const result = await db.transaction(async (tx) => {
      const { orgId, ownerId } = await createOwnerAndClub(tx, options, h.uuid);
      const existing = await tx.$count(teams, eq(teams.organizationId, orgId));
      if (existing > 0) {
        throw new Error(
          `"${options.clubName}" already has ${existing} teams, so it looks seeded. Pick another slug, or run "pnpm --filter @alice/database db reset" to start over.`
        );
      }
      return await seed({ db: tx, options, orgId, ownerId }, h);
    });
    process.stdout.write(
      `\nDone: ${options.clubName} now has ${result.teams} teams and ${result.players} players.\n`
    );
    process.stdout.write(
      `Sign in at the platform with: ${options.ownerEmail}\n`
    );
    if (options.passwordWasGenerated) {
      process.stdout.write(
        `Generated password (shown once): ${options.ownerPassword}\n`
      );
    }
  } finally {
    await db.$client.end();
  }
};

try {
  await main();
} catch (error) {
  process.stderr.write(
    `\nSEED FAILED: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
}
