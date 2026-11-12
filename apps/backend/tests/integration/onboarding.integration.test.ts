/**
 * Runs the onboarding saves against a REAL Postgres: the migrations are
 * applied, then each step is saved and the rows are read back.
 *
 * Needs TEST_DATABASE_URL (an empty `huddlekit_test` database). It never reads
 * DATABASE_URL, so it cannot touch a real environment by accident.
 * Run with `pnpm --filter @huddlekit/backend test:integration`.
 */

import { randomUUID } from "node:crypto";
import path from "node:path";

import {
  allergies,
  clubFeeSettings,
  clubTrainingSlots,
  consents,
  createDatabase,
  medicalRecords,
  onboardingDrafts,
  organizations,
  people,
  personAvailability,
  personRelationships,
  safeguardingChecks,
  users,
} from "@alice/database";
import { and, eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  SlugTakenError,
  clubStepInputSchema,
  saveClubStep,
} from "../../src/services/club-onboarding";
import {
  NotYourChildError,
  memberStepInputSchema,
  saveMemberStep,
} from "../../src/services/member-onboarding";
import { sendDueOnboardingReminders } from "../../src/services/onboarding-reminders";
import type { ReminderEmail } from "../../src/services/onboarding-reminders";

process.loadEnvFile(path.join(import.meta.dirname, "../../../../.env"));

const url = process.env.TEST_DATABASE_URL;
if (url === undefined || url === "") {
  throw new Error(
    "TEST_DATABASE_URL is not set. Add it to the root .env and create the database with `CREATE DATABASE huddlekit_test`."
  );
}

const db = createDatabase({ url });
const runId = randomUUID().slice(0, 8);
const parentUserId = randomUUID();
const otherUserId = randomUUID();
const organizationId = randomUUID();
const parent = { organizationId, userId: parentUserId };
const other = { organizationId, userId: otherUserId };

const member = async (
  caller: { organizationId: string; userId: string },
  step: string,
  data: unknown
) => {
  const input = memberStepInputSchema.parse({ data, step });
  await saveMemberStep(db, caller, input);
};

const club = async (step: string, data: unknown) => {
  const input = clubStepInputSchema.parse({ data, step });
  await saveClubStep(db, organizationId, input);
};

const personFor = async (userId: string) => {
  const [row] = await db
    .select()
    .from(people)
    .where(
      and(eq(people.organizationId, organizationId), eq(people.userId, userId))
    );
  if (row === undefined) {
    throw new Error("No person row");
  }
  return row;
};

describe("onboarding saves (real Postgres)", () => {
  beforeAll(async () => {
    await migrate(db, {
      migrationsFolder: path.join(
        import.meta.dirname,
        "../../../../packages/database/migrations"
      ),
      migrationsSchema: "drizzle",
      migrationsTable: "__drizzle_migrations",
    });
    await db.insert(users).values([
      {
        email: `parent-${runId}@example.com`,
        id: parentUserId,
        name: "Pat Parent",
      },
      {
        email: `other-${runId}@example.com`,
        id: otherUserId,
        name: "Olly Other",
      },
    ]);
    await db.insert(organizations).values({
      createdAt: new Date(),
      id: organizationId,
      name: "Test FC",
      slug: `test-fc-${runId}`,
    });
  });

  afterAll(async () => {
    // Safeguarding records block deleting a club on purpose, so the test clears its own first.
    await db
      .delete(safeguardingChecks)
      .where(eq(safeguardingChecks.organizationId, organizationId));
    // Removing the club and users cascades to everything else created below.
    await db.delete(organizations).where(eq(organizations.id, organizationId));
    await db.delete(users).where(eq(users.id, parentUserId));
    await db.delete(users).where(eq(users.id, otherUserId));
  });

  it("creates the person from the account on the first step, then updates it", async () => {
    await member(parent, "details", {
      firstName: "Patricia",
      lastName: "Parent",
    });
    await member(parent, "details", {
      firstName: "Pat",
      lastName: "Parent",
      phone: "07000",
    });

    const rows = await db
      .select()
      .from(people)
      .where(eq(people.userId, parentUserId));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.firstName).toBe("Pat");
    expect(rows[0]?.phone).toBe("07000");
  });

  it("keeps one address and edits it in place", async () => {
    const address = { city: "Leeds", countryCode: "GB", line1: "1 High St" };
    await member(parent, "address", address);
    const first = await personFor(parentUserId);
    await member(parent, "address", { ...address, city: "York" });
    const second = await personFor(parentUserId);

    expect(second.addressId).toBe(first.addressId);
  });

  it("archives old emergency contacts and keeps their rows", async () => {
    await member(parent, "safety", {
      contacts: [
        {
          firstName: "Gran",
          lastName: "Parent",
          phone: "0111",
          relationship: "grandparent",
        },
      ],
    });
    await member(parent, "safety", {
      contacts: [
        {
          firstName: "Uncle",
          lastName: "Parent",
          phone: "0222",
          relationship: "other",
        },
      ],
    });
    const me = await personFor(parentUserId);
    const links = await db
      .select()
      .from(personRelationships)
      .where(eq(personRelationships.personId, me.id));
    const contacts = await db
      .select()
      .from(people)
      .where(eq(people.organizationId, organizationId));
    const gran = contacts.find((row) => row.firstName === "Gran");
    const uncle = contacts.find((row) => row.firstName === "Uncle");

    expect(links).toHaveLength(2);
    expect(gran?.isActive).toBeFalsy();
    expect(uncle?.isActive).toBeTruthy();
  });

  it("ends a cleared medical record and archives a removed allergy", async () => {
    const medical = {
      allergies: [{ allergen: "Peanuts", severity: "severe" }],
      conditions: "Asthma",
    };
    await member(parent, "safety", { contacts: [], medical });
    await member(parent, "safety", {
      contacts: [],
      medical: { allergies: [], conditions: "" },
    });
    const me = await personFor(parentUserId);
    const [record] = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.personId, me.id));
    const [allergy] = await db
      .select()
      .from(allergies)
      .where(eq(allergies.personId, me.id));

    expect(record?.endedOn).not.toBeNull();
    expect(allergy?.archivedAt).not.toBeNull();
  });

  it("keeps one DBS check and sends an edit back to pending", async () => {
    const dbs = { level: "enhanced", onUpdateService: false };
    await member(parent, "dbs", { dbs });
    const me = await personFor(parentUserId);
    await db
      .update(safeguardingChecks)
      .set({ status: "valid" })
      .where(eq(safeguardingChecks.personId, me.id));
    await member(parent, "dbs", { dbs: { ...dbs, reference: "123" } });
    const checks = await db
      .select()
      .from(safeguardingChecks)
      .where(eq(safeguardingChecks.personId, me.id));

    expect(checks).toHaveLength(1);
    expect(checks[0]?.status).toBe("pending");
  });

  it("replaces availability slots", async () => {
    await member(parent, "availability", {
      slots: [
        { dayOfWeek: 1, slot: "evening" },
        { dayOfWeek: 3, slot: "morning" },
      ],
    });
    await member(parent, "availability", {
      slots: [{ dayOfWeek: 2, slot: "evening" }],
    });
    const me = await personFor(parentUserId);
    const rows = await db
      .select()
      .from(personAvailability)
      .where(eq(personAvailability.personId, me.id));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.dayOfWeek).toBe(2);
  });

  it("adds a child, refuses someone else's, and archives instead of deleting", async () => {
    await member(parent, "children", {
      children: [
        { dateOfBirth: "2016-04-02", firstName: "Kit", lastName: "Parent" },
      ],
    });
    const me = await personFor(parentUserId);
    const [link] = await db
      .select()
      .from(personRelationships)
      .where(eq(personRelationships.relatedPersonId, me.id));
    const childId = link?.personId ?? "";

    await expect(
      member(other, "permissions", {
        children: [{ consents: { travel: true }, id: childId }],
      })
    ).rejects.toBeInstanceOf(NotYourChildError);

    await member(parent, "children", { archiveChildIds: [childId] });
    const [child] = await db
      .select()
      .from(people)
      .where(eq(people.id, childId));

    expect(child?.isActive).toBeFalsy();
  });

  it("grants then withdraws a consent without losing the record", async () => {
    await member(parent, "permissions", { self: { photoVideo: true } });
    await member(parent, "permissions", { self: { photoVideo: false } });
    const me = await personFor(parentUserId);
    const rows = await db
      .select()
      .from(consents)
      .where(eq(consents.personId, me.id));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.withdrawnAt).not.toBeNull();
  });

  it("saves club steps and refuses a taken address", async () => {
    await club("fees", {
      absorbDirectDebitFee: false,
      frequency: "monthly",
      lateReminders: true,
      siblingDiscount: false,
      subscriptionMinor: 2500,
    });
    await club("schedule", {
      slots: [{ dayOfWeek: 2, endsAt: "20:00", startsAt: "18:30" }],
    });
    await club("schedule", {
      slots: [{ dayOfWeek: 4, endsAt: "20:00", startsAt: "18:30" }],
    });
    const fees = await db
      .select()
      .from(clubFeeSettings)
      .where(eq(clubFeeSettings.organizationId, organizationId));
    const slots = await db
      .select()
      .from(clubTrainingSlots)
      .where(eq(clubTrainingSlots.organizationId, organizationId));

    expect(fees[0]?.subscriptionMinor).toBe(2500);
    expect(slots).toHaveLength(1);
    expect(slots[0]?.dayOfWeek).toBe(4);

    const otherClubId = randomUUID();
    await db.insert(organizations).values({
      createdAt: new Date(),
      id: otherClubId,
      name: "Other FC",
      slug: `other-fc-${runId}`,
    });
    await expect(
      saveClubStep(
        db,
        otherClubId,
        clubStepInputSchema.parse({
          data: {
            clubType: "grassroots",
            name: "Other FC",
            sections: ["youth"],
            slug: `test-fc-${runId}`,
          },
          step: "club",
        })
      )
    ).rejects.toBeInstanceOf(SlugTakenError);
    await db.delete(organizations).where(eq(organizations.id, otherClubId));
  });
});

describe("onboarding reminders (real Postgres)", () => {
  const reminderUser = randomUUID();
  const HOUR = 3_600_000;
  const hoursAgo = (hours: number) => new Date(Date.now() - hours * HOUR);
  const sent: ReminderEmail[] = [];
  const run = async (result = true) =>
    await sendDueOnboardingReminders({
      db,
      now: new Date(),
      platformURL: "http://localhost:8000",
      send: async (email) => {
        sent.push(email);
        await Promise.resolve();
        return result;
      },
    });

  beforeAll(async () => {
    await db.insert(users).values({
      email: `reminder-${runId}@example.com`,
      id: reminderUser,
      name: "Remi Minder",
    });
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.id, reminderUser));
    // The last suite closes the shared connection pool.
    await db.$client.end();
  });

  const setDraft = async (hours: number, remindersSent = 0) => {
    await db
      .delete(onboardingDrafts)
      .where(eq(onboardingDrafts.userId, reminderUser));
    await db.insert(onboardingDrafts).values({
      data: "x",
      flow: "club",
      remindersSent,
      stepId: "fees",
      updatedAt: hoursAgo(hours),
      userId: reminderUser,
    });
    sent.length = 0;
  };

  it("sends nothing before 12 hours", async () => {
    await setDraft(11);

    await expect(run()).resolves.toBe(0);
  });

  it("sends the first reminder after 12 hours, once", async () => {
    await setDraft(13);
    const first = await run();
    const second = await run();

    expect(first).toBe(1);
    expect(second).toBe(0);
    expect(sent[0]?.reminder).toBe(1);
    expect(sent[0]?.resumeUrl).toBe("http://localhost:8000/onboarding-club");
  });

  it("sends the second after 24 hours and the last after 5 days, then stops", async () => {
    await setDraft(25, 1);
    await expect(run()).resolves.toBe(1);
    expect(sent[0]?.reminder).toBe(2);

    await setDraft(121, 2);
    await expect(run()).resolves.toBe(1);
    expect(sent[0]?.reminder).toBe(3);
    await expect(run()).resolves.toBe(0);
  });

  it("tries again next time when the email fails to send", async () => {
    await setDraft(13);
    await expect(run(false)).resolves.toBe(0);
    await expect(run(true)).resolves.toBe(1);
  });

  it("starts over when the draft is saved again", async () => {
    await setDraft(13, 1);
    await db
      .update(onboardingDrafts)
      .set({ remindersSent: 0, updatedAt: new Date() })
      .where(eq(onboardingDrafts.userId, reminderUser));

    await expect(run()).resolves.toBe(0);
  });
});
