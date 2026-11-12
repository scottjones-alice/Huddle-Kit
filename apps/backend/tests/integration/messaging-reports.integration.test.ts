/* oxlint-disable vitest/max-expects -- each test walks one whole scenario and checks every step of it */
import { people } from "@alice/database";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

import { createRouter } from "../../src/lib/create-app";
import messagingRouter from "../../src/routes/messaging/messaging.index";
import peopleRouter from "../../src/routes/people/people.index";
import reportsRouter from "../../src/routes/reports/reports.index";
import roles from "../../src/routes/roles/roles.index";
import teamsRouter from "../../src/routes/teams/teams.index";
import { createTestClub, testDb } from "./harness";

const router = createRouter()
  .route("/", messagingRouter)
  .route("/", peopleRouter)
  .route("/", reportsRouter)
  .route("/", teamsRouter)
  .route("/", roles);

const idBody = z.object({ id: z.string() });
const postBody = z.object({
  announcement: idBody,
  notified: z.number(),
});
const titlesBody = z.object({
  announcements: z.array(z.object({ title: z.string() })),
});
const inboxBody = z.object({
  notifications: z.array(z.object({ id: z.string(), title: z.string() })),
});

interface Requester {
  request: (
    method: string,
    path: string,
    body?: unknown
  ) => Promise<{ body: unknown; status: number }>;
}

const readOf = async <T extends z.ZodType>(
  member: Requester,
  path: string,
  schema: T
): Promise<z.infer<T>> => {
  const response = await member.request("GET", path);
  return schema.parse(response.body);
};

const setup = async () =>
  await createTestClub(router, {
    coachA: {},
    owner: { role: "owner" },
    parent: {},
    stranger: {},
    treasurer: { jobs: ["treasurer"] },
  });

let club: Awaited<ReturnType<typeof setup>>;

describe("messaging and reports (real Postgres)", () => {
  let teamAId = "";

  beforeAll(async () => {
    club = await setup();
    const { owner, parent, stranger, coachA } = club.people;
    const own = await testDb
      .insert(people)
      .values([
        {
          firstName: "Pat",
          lastName: "Parent",
          organizationId: club.organizationId,
          userId: parent.id,
        },
        {
          firstName: "Sam",
          lastName: "Stranger",
          organizationId: club.organizationId,
          userId: stranger.id,
        },
      ])
      .returning();
    const patId = own.find((row) => row.firstName === "Pat")?.id ?? "";
    const child = await owner.request("POST", "/people", {
      firstName: "Kit",
      lastName: "Parent",
    });
    const childId = idBody.parse(child.body).id;
    await owner.request("POST", `/people/${childId}/relationships`, {
      hasParentalResponsibility: true,
      relatedPersonId: patId,
      relationship: "parent",
    });
    const season = await owner.request("POST", "/seasons", {
      endsOn: "2027-05-31",
      isCurrent: true,
      name: "2026/27",
      startsOn: "2026-08-01",
    });
    const team = await owner.request("POST", "/teams", {
      ageGroup: 10,
      name: "U10 Reds",
      seasonId: idBody.parse(season.body).id,
    });
    teamAId = idBody.parse(team.body).id;
    await owner.request("POST", `/teams/${teamAId}/members`, {
      personId: childId,
      role: "player",
    });
    await owner.request("POST", "/role-assignments", {
      role: "coach",
      scope: "teams",
      teamIds: [teamAId],
      userId: coachA.id,
    });
  });

  afterAll(async () => {
    await club.cleanup();
  });

  it("lets a coach post to their team and tells the parent but not a stranger", async () => {
    const { coachA, parent, stranger } = club.people;
    const posted = await coachA.request("POST", "/announcements", {
      body: "Training moved to the clubhouse",
      teamId: teamAId,
      title: "Venue change",
    });
    const inbox = await parent.request("GET", "/notifications");
    const strangerInbox = await stranger.request("GET", "/notifications");
    const club_wide = await coachA.request("POST", "/announcements", {
      body: "Everyone",
      title: "Whole club",
    });

    expect(postBody.parse(posted.body).notified).toBe(1);
    expect(
      inboxBody.parse(inbox.body).notifications.map((n) => n.title)
    ).toContain("Venue change");
    expect(inboxBody.parse(strangerInbox.body).notifications).toHaveLength(0);
    expect(club_wide.status).toBe(403);
  });

  it("shows team posts only to the team's people, and club posts to everyone", async () => {
    const { owner, parent, stranger } = club.people;
    await owner.request("POST", "/announcements", {
      body: "AGM next week",
      title: "AGM",
    });
    const [asParent, asStranger] = await Promise.all([
      parent.request("GET", "/announcements"),
      stranger.request("GET", "/announcements"),
    ]);
    const parentTitles = titlesBody
      .parse(asParent.body)
      .announcements.map((a) => a.title);
    const strangerTitles = titlesBody
      .parse(asStranger.body)
      .announcements.map((a) => a.title);

    expect(new Set(parentTitles)).toStrictEqual(
      new Set(["Venue change", "AGM"])
    );
    expect(strangerTitles).toStrictEqual(["AGM"]);
  });

  it("keeps a draft quiet until it is published, and tells people only once", async () => {
    const { coachA, parent } = club.people;
    const draft = await coachA.request("POST", "/announcements", {
      body: "Maybe a match",
      publish: false,
      teamId: teamAId,
      title: "Draft",
    });
    const { announcement } = postBody.parse(draft.body);
    const hidden = await readOf(parent, "/announcements", titlesBody);
    const published = await coachA.request(
      "PATCH",
      `/announcements/${announcement.id}`,
      {
        publish: true,
      }
    );
    const again = await coachA.request(
      "PATCH",
      `/announcements/${announcement.id}`,
      {
        publish: true,
      }
    );

    expect(postBody.parse(draft.body).notified).toBe(0);
    expect(hidden.announcements.map((a) => a.title)).not.toContain("Draft");
    expect(postBody.parse(published.body).notified).toBe(1);
    expect(postBody.parse(again.body).notified).toBe(0);
  });

  it("lets someone mark notifications read", async () => {
    const { parent } = club.people;
    const inbox = await readOf(parent, "/notifications", inboxBody);
    const first = inbox.notifications[0]?.id ?? "";
    const one = await parent.request("POST", `/notifications/${first}/read`);
    const all = await parent.request("POST", "/notifications/read");
    const unread = await readOf(
      parent,
      "/notifications?unread=true",
      inboxBody
    );

    expect(one.status).toBe(200);
    expect(all.status).toBe(200);
    expect(unread.notifications).toHaveLength(0);
  });

  it("keeps reports to the people who should see them", async () => {
    const { coachA, owner, parent, stranger, treasurer } = club.people;
    const attendance = `/reports/attendance?teamId=${teamAId}`;
    const [summary, summaryParent, finance, financeCoach, mine, notMine] =
      await Promise.all([
        owner.request("GET", "/reports/club-summary"),
        parent.request("GET", "/reports/club-summary"),
        treasurer.request("GET", "/reports/finance"),
        coachA.request("GET", "/reports/finance"),
        coachA.request("GET", attendance),
        stranger.request("GET", attendance),
      ]);

    expect(summary.body).toMatchObject({ activeTeams: 1 });
    expect(summaryParent.status).toBe(403);
    expect(finance.status).toBe(200);
    expect(financeCoach.status).toBe(403);
    expect(mine.status).toBe(200);
    expect(notMine.status).toBe(403);
  });
});
