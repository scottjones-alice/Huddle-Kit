/**
 * Runs against a REAL Postgres: applies the generated migrations, then checks
 * inserts, relational queries and cascading deletes through the same
 * `createDatabase` the apps use.
 *
 * Needs TEST_DATABASE_URL (see .env.example): an empty `huddlekit_test`
 * database on your local Postgres. Run with `pnpm --filter @alice/database test:integration`.
 * It never reads DATABASE_URL, so it can't touch a real environment by accident.
 */

import { randomUUID } from "node:crypto";
import path from "node:path";

import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createDatabase,
  generateSeriesEvents,
  recordAuditEvent,
} from "../../src/index";
import {
  accounts,
  invitations,
  members,
  organizations,
  sessions,
  users,
  verifications,
} from "../../src/schema/authentication";
import { seasons } from "../../src/schema/football/seasons";
import { auditEvents } from "../../src/schema/governance/audit-events";
import { consents } from "../../src/schema/governance/consent";
import { people } from "../../src/schema/people/people";
import { safeguardingConcerns } from "../../src/schema/safeguarding/concerns";
import { safeguardingNotes } from "../../src/schema/safeguarding/notes";

config({
  path: path.join(import.meta.dirname, "../../../../.env"),
  quiet: true,
});

const url = process.env.TEST_DATABASE_URL;

if (url === undefined || url === "") {
  throw new Error(
    "TEST_DATABASE_URL is not set. Add it to the root .env (see .env.example) and create the database with `CREATE DATABASE huddlekit_test`."
  );
}

const db = createDatabase({ url });
const runId = randomUUID();
const userId = randomUUID();
const organizationId = randomUUID();

const insertSensitive = async (checksum: string | null) => {
  await db.$client.query(
    "insert into files (bucket, content_type, file_name, key, kind, organization_id, size_bytes, checksum_sha256) values ('b', 'application/pdf', 'dbs.pdf', $1, 'sensitive', $2, 1, $3)",
    [randomUUID(), organizationId, checksum]
  );
};

describe("database (real Postgres)", () => {
  beforeAll(async () => {
    await migrate(db, {
      migrationsFolder: path.join(import.meta.dirname, "../../migrations"),
      migrationsSchema: "drizzle",
      migrationsTable: "__drizzle_migrations",
    });
  });

  afterAll(async () => {
    // Deleting the user and organization cascades to every row created below.
    await db.delete(users).where(eq(users.id, userId));
    await db.delete(organizations).where(eq(organizations.id, organizationId));
    await db.delete(verifications).where(eq(verifications.identifier, runId));
    await db.$client.end();
  });

  it("applies migrations so every table exists", async () => {
    const result = await db.$client.query<{ table_name: string }>(
      "select table_name from information_schema.tables where table_schema = 'public'"
    );
    const names = new Set(result.rows.map((row) => row.table_name));

    for (const table of [
      "accounts",
      "invitations",
      "members",
      "organizations",
      "sessions",
      "users",
      "verifications",
    ]) {
      expect(names.has(table)).toBeTruthy();
    }
  });

  it("inserts rows and returns them with generated ids and defaults", async () => {
    const [user] = await db
      .insert(users)
      .values({ email: `${runId}@example.com`, id: userId, name: "Test User" })
      .returning();

    expect(user?.id).toBe(userId);
    expect(user?.emailVerified).toBeFalsy();
    expect(user?.createdAt).toBeInstanceOf(Date);
  });

  it("loads related rows through db.query relations", async () => {
    await db.insert(organizations).values({
      createdAt: new Date(),
      id: organizationId,
      name: "Test Org",
      slug: `org-${runId}`,
    });
    await db.insert(members).values({
      createdAt: new Date(),
      organizationId,
      role: "owner",
      userId,
    });
    await db.insert(sessions).values({
      expiresAt: new Date(Date.now() + 60_000),
      token: `token-${runId}`,
      updatedAt: new Date(),
      userId,
    });
    await db.insert(accounts).values({
      accountId: runId,
      providerId: "credential",
      updatedAt: new Date(),
      userId,
    });

    const user = await db.query.users.findFirst({
      where: { id: userId },
      with: {
        accounts: true,
        members: { with: { organization: true } },
        sessions: true,
      },
    });

    expect(user?.members).toHaveLength(1);
    expect(user?.members[0]?.organization?.slug).toBe(`org-${runId}`);
    expect(user?.sessions).toHaveLength(1);
    expect(user?.accounts).toHaveLength(1);
  });

  it("enforces unique emails", async () => {
    await expect(
      db
        .insert(users)
        .values({ email: `${runId}@example.com`, name: "Duplicate" })
    ).rejects.toThrow(Error);
  });

  it("queries tables without relations", async () => {
    await db.insert(verifications).values({
      expiresAt: new Date(Date.now() + 60_000),
      identifier: runId,
      value: "123456",
    });

    const found = await db.query.verifications.findFirst({
      where: { identifier: runId },
    });

    expect(found?.value).toBe("123456");
  });

  it("rejects values outside the allowed lists even when Zod is bypassed", async () => {
    const insertFile = async (
      kind: string,
      sizeBytes: number,
      checksum?: string
    ) => {
      await db.$client.query(
        "insert into files (bucket, content_type, file_name, key, kind, organization_id, size_bytes, checksum_sha256) values ('b', 'image/png', 'x.png', $1, $2, $3, $4, $5)",
        [randomUUID(), kind, organizationId, sizeBytes, checksum ?? null]
      );
    };

    await expect(insertFile("video", 1)).rejects.toThrow(/files_kind_chk/u);
    await expect(insertFile("photo", -1)).rejects.toThrow(
      /files_sizeBytes_chk/u
    );
    await expect(insertFile("photo", 1, "not-a-hash")).rejects.toThrow(
      /files_checksumSha256_chk/u
    );
    await expect(
      db.$client.query(
        "insert into addresses (city, country_code, line_1, organization_id) values ('Leeds', 'gb', '1 High St', $1)",
        [organizationId]
      )
    ).rejects.toThrow(/addresses_countryCode_chk/u);
  });

  it("requires a checksum on sensitive files", async () => {
    await expect(insertSensitive(null)).rejects.toThrow(
      /files_sensitiveChecksum_chk/u
    );
    await expect(insertSensitive("a".repeat(64))).resolves.toBeUndefined();
  });

  it("stores our timestamps with a time zone", async () => {
    const result = await db.$client.query<{ data_type: string }>(
      "select data_type from information_schema.columns where table_name = 'audit_events' and column_name = 'occurred_at'"
    );

    expect(result.rows[0]?.data_type).toBe("timestamp with time zone");
  });

  it("keeps audit events append-only", async () => {
    const [event] = await db
      .insert(auditEvents)
      .values({
        action: "person.read",
        entityType: "person",
        organizationId,
      })
      .returning();

    expect(event?.occurredAt).toBeInstanceOf(Date);

    await expect(
      db.$client.query("update audit_events set action = 'x.y' where id = $1", [
        event?.id,
      ])
    ).rejects.toThrow(/append-only/u);
    await expect(
      db.$client.query("delete from audit_events where id = $1", [event?.id])
    ).rejects.toThrow(/append-only/u);
    await expect(db.$client.query("truncate audit_events")).rejects.toThrow(
      /append-only/u
    );
  });

  it("allows one current season per organization and dates in order", async () => {
    await db.insert(seasons).values({
      endsOn: "2027-06-30",
      isCurrent: true,
      name: "2026/27",
      organizationId,
      startsOn: "2026-08-01",
    });

    await expect(
      db.$client.query(
        "insert into seasons (name, organization_id, starts_on, ends_on, is_current) values ('2027/28', $1, '2027-08-01', '2028-06-30', true)",
        [organizationId]
      )
    ).rejects.toThrow(/seasons_organizationId_current_uidx/u);
    await expect(
      db.$client.query(
        "insert into seasons (name, organization_id, starts_on, ends_on) values ('Backwards', $1, '2027-08-01', '2027-01-01')",
        [organizationId]
      )
    ).rejects.toThrow(/seasons_dates_chk/u);
  });

  it("allows one active consent per person and type until it is withdrawn", async () => {
    const personId = randomUUID();

    await db.insert(people).values({
      firstName: "Sam",
      id: personId,
      lastName: "Taylor",
      organizationId,
    });
    await db.insert(consents).values({
      grantedAt: new Date(),
      organizationId,
      personId,
      type: "photo_video",
    });

    await expect(
      db.$client.query(
        "insert into consents (granted_at, organization_id, person_id, type) values (now(), $1, $2, 'photo_video')",
        [organizationId, personId]
      )
    ).rejects.toThrow(/consents_active_uidx/u);

    await db
      .update(consents)
      .set({ withdrawnAt: new Date() })
      .where(eq(consents.personId, personId));
    await db.insert(consents).values({
      grantedAt: new Date(),
      organizationId,
      personId,
      type: "photo_video",
    });

    await expect(
      db.query.consents.findMany({ where: { personId } })
    ).resolves.toHaveLength(2);
  });

  // Safeguarding rows can never be deleted (that is the point), so this test uses its own
  // organization and leaves its rows behind in the test database. The slug is unique per run.
  it("protects safeguarding records from edits and deletion", async () => {
    const safeOrganizationId = randomUUID();
    const subjectId = randomUUID();

    await db.insert(organizations).values({
      createdAt: new Date(),
      id: safeOrganizationId,
      name: "Safeguarding Test Org",
      slug: `safeguarding-${runId}`,
    });
    await db.insert(people).values({
      firstName: "Alex",
      id: subjectId,
      lastName: "Jones",
      organizationId: safeOrganizationId,
    });
    const [concern] = await db
      .insert(safeguardingConcerns)
      .values({
        organizationId: safeOrganizationId,
        severity: "low",
        subjectPersonId: subjectId,
        summary: "Test concern",
      })
      .returning();
    await db.insert(safeguardingNotes).values({
      body: "Opened",
      concernId: concern?.id ?? "",
      organizationId: safeOrganizationId,
    });

    await expect(
      db.$client.query(
        "update safeguarding_concerns set status = 'closed' where id = $1",
        [concern?.id]
      )
    ).rejects.toThrow(/safeguardingConcerns_closed_chk/u);
    await expect(
      db.$client.query("update safeguarding_notes set body = 'edited'")
    ).rejects.toThrow(/append-only/u);
    await expect(
      db.$client.query("delete from safeguarding_notes")
    ).rejects.toThrow(/append-only/u);
    await expect(
      db.$client.query("delete from people where id = $1", [subjectId])
    ).rejects.toThrow(/violates .*foreign key/u);
    await expect(
      db.$client.query("delete from organizations where id = $1", [
        safeOrganizationId,
      ])
    ).rejects.toThrow(/violates .*foreign key/u);
  });

  it("rejects references that cross organizations", async () => {
    const otherOrganizationId = randomUUID();
    const otherAddressId = randomUUID();
    const otherPersonId = randomUUID();

    await db.insert(organizations).values({
      createdAt: new Date(),
      id: otherOrganizationId,
      name: "Other Org",
      slug: `other-${runId}`,
    });

    try {
      await db.$client.query(
        "insert into addresses (id, city, country_code, line_1, organization_id) values ($1, 'Leeds', 'GB', '1 High St', $2)",
        [otherAddressId, otherOrganizationId]
      );
      await db.$client.query(
        "insert into people (id, first_name, last_name, organization_id) values ($1, 'Kim', 'Lee', $2)",
        [otherPersonId, otherOrganizationId]
      );

      // A person here cannot use another club's address.
      await expect(
        db.$client.query(
          "insert into people (first_name, last_name, organization_id, address_id) values ('Sam', 'Ng', $1, $2)",
          [organizationId, otherAddressId]
        )
      ).rejects.toThrow(/people_address_same_org_fkey/u);

      // Nor can a consent here point at another club's person.
      await expect(
        db.$client.query(
          "insert into consents (granted_at, organization_id, person_id, type) values (now(), $1, $2, 'photo_video')",
          [organizationId, otherPersonId]
        )
      ).rejects.toThrow(/consents_person_same_org_fkey/u);
    } finally {
      await db
        .delete(organizations)
        .where(eq(organizations.id, otherOrganizationId));
    }
  });

  it("keeps events, match scores and attendance consistent", async () => {
    const eventId = randomUUID();
    const personId = randomUUID();
    const opponentId = randomUUID();

    await db.$client.query(
      "insert into people (id, first_name, last_name, organization_id) values ($1, 'Pat', 'Kay', $2)",
      [personId, organizationId]
    );
    await db.$client.query(
      "insert into opponents (id, name, organization_id) values ($1, 'Rovers', $2)",
      [opponentId, organizationId]
    );
    await db.$client.query(
      "insert into events (id, kind, organization_id, starts_at, ends_at, title) values ($1, 'match', $2, '2026-09-05 10:00+00', '2026-09-05 11:30+00', 'Cup tie')",
      [eventId, organizationId]
    );
    await db.$client.query(
      "insert into match_details (event_id, home_away, opponent_id, organization_id) values ($1, 'home', $2, $3)",
      [eventId, opponentId, organizationId]
    );

    await expect(
      db.$client.query(
        "insert into events (kind, organization_id, starts_at, ends_at, title) values ('match', $1, '2026-09-05 10:00+00', '2026-09-05 09:00+00', 'Backwards')",
        [organizationId]
      )
    ).rejects.toThrow(/events_dates_chk/u);
    await expect(
      db.$client.query(
        "update match_details set goals_for = 2 where event_id = $1",
        [eventId]
      )
    ).rejects.toThrow(/matchDetails_score_chk/u);
    await expect(
      db.$client.query("delete from opponents where id = $1", [opponentId])
    ).rejects.toThrow(/violates .*foreign key/u);

    await db.$client.query(
      "insert into event_attendance (event_id, organization_id, person_id, status) values ($1, $2, $3, 'present')",
      [eventId, organizationId, personId]
    );

    await expect(
      db.$client.query(
        "insert into event_attendance (event_id, organization_id, person_id, status) values ($1, $2, $3, 'late')",
        [eventId, organizationId, personId]
      )
    ).rejects.toThrow(/event_attendance_event_person_uidx/u);
  });

  it("links generated events to a series without duplicates", async () => {
    const seriesId = randomUUID();

    await db.$client.query(
      "insert into event_series (id, organization_id, kind, title, weekday, start_time, time_zone, duration_minutes, starts_on) values ($1, $2, 'training', 'Tuesday training', 2, '18:00', 'Europe/London', 90, '2026-09-01')",
      [seriesId, organizationId]
    );

    const insertOccurrence = async (
      occurrence: string,
      seriesColumn: string | null = seriesId
    ) => {
      await db.$client.query(
        "insert into events (kind, organization_id, series_id, series_occurrence_starts_at, starts_at, ends_at, title) values ('training', $1, $2, $3, $3, $3::timestamptz + interval '90 minutes', 'Tuesday training')",
        [organizationId, seriesColumn, occurrence]
      );
    };

    await insertOccurrence("2026-09-08 18:00+00");
    await expect(insertOccurrence("2026-09-08 18:00+00")).rejects.toThrow(
      /events_series_occurrence_uidx/u
    );
    await expect(insertOccurrence("2026-09-15 18:00+00", null)).rejects.toThrow(
      /events_series_chk/u
    );
    await expect(
      db.$client.query("delete from event_series where id = $1", [seriesId])
    ).rejects.toThrow(/violates .*foreign key/u);
    await expect(
      db.$client.query(
        "insert into event_series (organization_id, kind, title, weekday, start_time, time_zone, duration_minutes, starts_on) values ($1, 'training', 'Bad', 8, '18:00', 'Europe/London', 90, '2026-09-01')",
        [organizationId]
      )
    ).rejects.toThrow(/eventSeries_weekday_chk/u);
  });

  it("generates series events once and carries on from where it stopped", async () => {
    const seriesId = randomUUID();

    await db.$client.query(
      "insert into event_series (id, organization_id, kind, title, weekday, start_time, time_zone, duration_minutes, starts_on) values ($1, $2, 'training', 'Generated training', 3, '19:00', 'Europe/London', 60, '2026-09-02')",
      [seriesId, organizationId]
    );

    await expect(
      generateSeriesEvents(db, seriesId, "2026-09-16")
    ).resolves.toStrictEqual({ created: 3, generatedUntil: "2026-09-16" });
    await expect(
      generateSeriesEvents(db, seriesId, "2026-09-16")
    ).resolves.toStrictEqual({ created: 0, generatedUntil: "2026-09-16" });
    await expect(
      generateSeriesEvents(db, seriesId, "2026-09-30")
    ).resolves.toStrictEqual({ created: 2, generatedUntil: "2026-09-30" });
    await expect(
      db.query.events.findMany({ where: { seriesId } })
    ).resolves.toHaveLength(5);
  });

  it("versions consent wording and ties grants to a document of the same type", async () => {
    const personId = randomUUID();
    const documentId = randomUUID();

    await db.$client.query(
      "insert into people (id, first_name, last_name, organization_id) values ($1, 'Lou', 'Park', $2)",
      [personId, organizationId]
    );
    await db.$client.query(
      "insert into consent_documents (id, organization_id, type, version, title, body) values ($1, $2, 'travel', 1, 'Travel', 'We may travel to away games.')",
      [documentId, organizationId]
    );

    await expect(
      db.$client.query(
        "update consent_documents set body = 'changed' where id = $1",
        [documentId]
      )
    ).rejects.toThrow(/immutable/u);
    await db.$client.query(
      "update consent_documents set retired_at = now() where id = $1",
      [documentId]
    );
    await expect(
      db.$client.query(
        "insert into consents (granted_at, organization_id, person_id, type, document_id) values (now(), $1, $2, 'photo_video', $3)",
        [organizationId, personId, documentId]
      )
    ).rejects.toThrow(/consents_document_same_org_fkey/u);
    await db.$client.query(
      "insert into consents (granted_at, organization_id, person_id, type, document_id) values (now(), $1, $2, 'travel', $3)",
      [organizationId, personId, documentId]
    );
    await expect(
      db.$client.query("delete from consent_documents where id = $1", [
        documentId,
      ])
    ).rejects.toThrow(/violates .*foreign key/u);
  });

  it("keeps registrations, charges and payments consistent", async () => {
    const personId = randomUUID();
    const seasonId = randomUUID();
    const feeId = randomUUID();
    const chargeId = randomUUID();

    await db.$client.query(
      "insert into people (id, first_name, last_name, organization_id) values ($1, 'Max', 'Ode', $2)",
      [personId, organizationId]
    );
    await db.$client.query(
      "insert into seasons (id, name, organization_id, starts_on, ends_on) values ($1, '2030/31', $2, '2030-08-01', '2031-06-30')",
      [seasonId, organizationId]
    );
    await db.$client.query(
      "insert into registrations (organization_id, person_id, season_id, registered_on) values ($1, $2, $3, '2030-07-01')",
      [organizationId, personId, seasonId]
    );

    await expect(
      db.$client.query(
        "insert into registrations (organization_id, person_id, season_id, registered_on, status) values ($1, $2, $3, '2030-07-01', 'withdrawn')",
        [organizationId, personId, seasonId]
      )
    ).rejects.toThrow(/registrations_(?:withdrawn_chk|person_season_uidx)/u);
    await expect(
      db.$client.query(
        "update registrations set status = 'withdrawn' where person_id = $1",
        [personId]
      )
    ).rejects.toThrow(/registrations_withdrawn_chk/u);

    await db.$client.query(
      "insert into fees (id, amount_minor, name, organization_id, season_id) values ($1, 2500, 'Subs', $2, $3)",
      [feeId, organizationId, seasonId]
    );
    await db.$client.query(
      "insert into fee_charges (id, amount_minor, currency, fee_id, organization_id, person_id) values ($1, 2500, 'GBP', $2, $3, $4)",
      [chargeId, feeId, organizationId, personId]
    );

    await expect(
      db.$client.query(
        "update fee_charges set status = 'waived' where id = $1",
        [chargeId]
      )
    ).rejects.toThrow(/feeCharges_waived_chk/u);
    await expect(
      db.$client.query(
        "insert into payments (amount_minor, charge_id, currency, method, organization_id) values (0, $1, 'GBP', 'cash', $2)",
        [chargeId, organizationId]
      )
    ).rejects.toThrow(/payments_amountMinor_chk/u);
    await db.$client.query(
      "insert into payments (amount_minor, charge_id, currency, method, organization_id) values (2500, $1, 'GBP', 'cash', $2)",
      [chargeId, organizationId]
    );
    await expect(
      db.$client.query("delete from fee_charges where id = $1", [chargeId])
    ).rejects.toThrow(/violates .*foreign key/u);
  });

  // Safeguarding checks can never be deleted with their organization, so this test uses its own
  // organization and leaves its rows behind in the test database. The slug is unique per run.
  it("limits DBS fields to DBS checks and ties notifications to an entity", async () => {
    const checkOrganizationId = randomUUID();
    const personId = randomUUID();

    await db.insert(organizations).values({
      createdAt: new Date(),
      id: checkOrganizationId,
      name: "Checks Test Org",
      slug: `checks-${runId}`,
    });
    await db.$client.query(
      "insert into people (id, first_name, last_name, organization_id) values ($1, 'Eli', 'Fox', $2)",
      [personId, checkOrganizationId]
    );
    await db.$client.query(
      "insert into safeguarding_checks (kind, organization_id, person_id, dbs_level) values ('dbs', $1, $2, 'enhanced')",
      [checkOrganizationId, personId]
    );
    await expect(
      db.$client.query(
        "insert into safeguarding_checks (kind, organization_id, person_id, dbs_level) values ('first_aid', $1, $2, 'enhanced')",
        [checkOrganizationId, personId]
      )
    ).rejects.toThrow(/safeguardingChecks_dbsOnly_chk/u);
    await expect(
      db.$client.query(
        "insert into notifications (kind, organization_id, title, user_id, entity_type) values ('other', $1, 'Hi', $2, 'event')",
        [organizationId, userId]
      )
    ).rejects.toThrow(/notifications_entity_chk/u);
  });

  it("writes validated audit events", async () => {
    const event = await recordAuditEvent(db, {
      action: "medical_record.read",
      actorUserId: userId,
      entityType: "medical_record",
      organizationId,
    });

    expect(event.id).toBeTruthy();
    await expect(
      recordAuditEvent(db, {
        action: "Not Valid",
        entityType: "medical_record",
        organizationId,
      })
    ).rejects.toThrow(Error);
  });

  it("cascades deletes from a user to their dependent rows", async () => {
    await db.insert(invitations).values({
      email: "invitee@example.com",
      expiresAt: new Date(Date.now() + 60_000),
      inviterId: userId,
      organizationId,
    });

    await db.delete(users).where(eq(users.id, userId));

    await expect(
      db.query.sessions.findMany({ where: { userId } })
    ).resolves.toHaveLength(0);
    await expect(
      db.query.members.findMany({ where: { userId } })
    ).resolves.toHaveLength(0);
    await expect(
      db.query.invitations.findMany({ where: { inviterId: userId } })
    ).resolves.toHaveLength(0);
  });
});
