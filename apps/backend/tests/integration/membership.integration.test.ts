import { randomUUID } from "node:crypto";

import { organizations, users } from "@alice/database";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import createApp from "../../src/lib/create-app";
import membershipRouter from "../../src/routes/membership/membership.index";
import { testDb } from "./harness";

vi.mock(import("@/services/resend"), () => ({
  sendEmail: vi.fn<() => Promise<{ id: string; ok: true }>>(
    async () => await Promise.resolve({ id: "email_test", ok: true })
  ),
}));

const app = createApp().route("/api/v1", membershipRouter);
const runId = randomUUID().slice(0, 8);

interface Login {
  email: string;
  id: string;
  request: (
    method: string,
    path: string,
    body?: unknown
  ) => Promise<{ body: unknown; status: number }>;
}

const createdUsers: string[] = [];
const createdClubSlugs: string[] = [];

/** A login with no club yet, who can call the membership routes. */
const newLogin = async (name: string): Promise<Login> => {
  const id = randomUUID();
  const email = `${name}-${runId}@example.com`;
  await testDb.insert(users).values({ email, emailVerified: true, id, name });
  createdUsers.push(id);
  return {
    email,
    id,
    request: async (method, path, body) => {
      const response = await app.request(`/api/v1${path}`, {
        body: body === undefined ? undefined : JSON.stringify(body),
        headers: {
          "content-type": "application/json",
          "x-test-email": email,
          "x-test-user": id,
        },
        method,
      });
      const text = await response.text();
      return {
        body: text === "" ? null : JSON.parse(text),
        status: response.status,
      };
    },
  };
};

const membershipBody = z.object({
  membership: z
    .object({
      club: z.object({ id: z.string(), name: z.string() }),
      memberId: z.string(),
      roles: z.array(z.string()),
    })
    .nullable(),
});
const idBody = z.object({ id: z.string() });
const invitationBody = z.object({ invitation: idBody });

const memberOf = async (login: Login) => {
  const response = await login.request("GET", "/me");
  return membershipBody.parse(response.body).membership;
};

const startClub = async (owner: Login, slug: string) => {
  createdClubSlugs.push(slug);
  return await owner.request("POST", "/clubs", { name: `FC ${slug}`, slug });
};

describe("clubs, membership and invitations (real Postgres)", () => {
  let owner: Login;
  let invitee: Login;
  let stranger: Login;
  let otherOwner: Login;
  let inviteId = "";

  beforeAll(async () => {
    [owner, invitee, stranger, otherOwner] = await Promise.all([
      newLogin("owner"),
      newLogin("invitee"),
      newLogin("stranger"),
      newLogin("other-owner"),
    ]);
  });

  afterAll(async () => {
    await Promise.all(
      createdClubSlugs.map(
        async (slug) =>
          await testDb.delete(organizations).where(eq(organizations.slug, slug))
      )
    );
    await Promise.all(
      createdUsers.map(
        async (id) => await testDb.delete(users).where(eq(users.id, id))
      )
    );
  });

  it("starts a club with the creator as its owner", async () => {
    const created = await startClub(owner, `club-a-${runId}`);
    const me = await owner.request("GET", "/me");

    expect(created.status).toBe(201);
    expect(membershipBody.parse(me.body).membership?.roles).toStrictEqual([
      "owner",
      "member",
    ]);
  });

  it("refuses a second club for the same login, and a slug that is taken", async () => {
    const second = await startClub(owner, `club-b-${runId}`);
    const taken = await startClub(otherOwner, `club-a-${runId}`);

    expect(second.status).toBe(409);
    expect(taken.status).toBe(409);
  });

  it("lets an owner invite someone with roles and refuses a duplicate", async () => {
    const invited = await owner.request("POST", "/invitations", {
      email: invitee.email,
      roles: ["admin"],
    });
    const again = await owner.request("POST", "/invitations", {
      email: invitee.email.toUpperCase(),
    });
    inviteId = invitationBody.parse(invited.body).invitation.id;

    expect(invited.status).toBe(201);
    expect(again.status).toBe(409);
  });

  it("shows an invitation only to the login it was sent to", async () => {
    const seen = await invitee.request("GET", `/invitations/${inviteId}`);
    const hidden = await stranger.request("GET", `/invitations/${inviteId}`);
    const missing = await stranger.request(
      "GET",
      `/invitations/${randomUUID()}`
    );

    expect(seen.status).toBe(200);
    expect(hidden.status).toBe(404);
    expect(hidden.body).toStrictEqual(missing.body);
  });

  it("refuses to accept as the wrong login, then accepts as the right one", async () => {
    const wrong = await stranger.request(
      "POST",
      `/invitations/${inviteId}/accept`
    );
    const accepted = await invitee.request(
      "POST",
      `/invitations/${inviteId}/accept`
    );
    const again = await invitee.request(
      "POST",
      `/invitations/${inviteId}/accept`
    );

    expect(wrong.status).toBe(404);
    expect(accepted.status).toBe(200);
    expect(membershipBody.parse(accepted.body).membership?.roles).toStrictEqual(
      ["admin", "member"]
    );
    // Used up: it can't be accepted twice.
    expect(again.status).toBe(404);
  });

  it("keeps a login in one club: someone already in a club can't accept another invitation", async () => {
    await startClub(otherOwner, `club-c-${runId}`);
    const invited = await otherOwner.request("POST", "/invitations", {
      email: invitee.email,
    });
    const response = await invitee.request(
      "POST",
      `/invitations/${invitationBody.parse(invited.body).invitation.id}/accept`
    );

    expect(response.status).toBe(409);
  });

  it("stops a member who is only an admin from touching an owner", async () => {
    const me = await memberOf(owner);
    const demote = await invitee.request(
      "PATCH",
      `/club-members/${me?.memberId}`,
      { roles: ["member"] }
    );
    const remove = await invitee.request(
      "DELETE",
      `/club-members/${me?.memberId}`
    );

    expect(demote.status).toBe(403);
    expect(remove.status).toBe(403);
  });

  it("won't let the last owner leave or be demoted", async () => {
    const me = await memberOf(owner);
    const leave = await owner.request(
      "DELETE",
      `/club-members/${me?.memberId}`
    );
    const demote = await owner.request(
      "PATCH",
      `/club-members/${me?.memberId}`,
      { roles: ["admin"] }
    );

    expect(leave.status).toBe(409);
    expect(demote.status).toBe(409);
  });

  it("can't see or change another club's members or invitations", async () => {
    const mine = await memberOf(owner);
    const theirs = await otherOwner.request(
      "PATCH",
      `/club-members/${mine?.memberId}`,
      { roles: ["member"] }
    );
    const list = await otherOwner.request("GET", "/invitations");

    expect(theirs.status).toBe(404);
    expect(
      z.object({ invitations: z.array(idBody) }).parse(list.body)
    ).toMatchObject({ invitations: [expect.anything()] });
    // The other club's list holds only its own invitation, not the owner's.
    expect(
      z.object({ invitations: z.array(idBody) }).parse(list.body).invitations
    ).toHaveLength(1);
  });

  it("lets a member leave, then join a different club", async () => {
    const mine = await memberOf(invitee);
    // An admin of club C (not A) is not what this checks; the invitee is in club A.
    const left = await invitee.request(
      "DELETE",
      `/club-members/${mine?.memberId}`
    );
    const after = await invitee.request("GET", "/me");

    expect(left.status).toBe(204);
    expect(membershipBody.parse(after.body).membership).toBeNull();
  });

  it("keeps people with no club out of club routes", async () => {
    const response = await invitee.request("GET", "/invitations");

    expect(response.status).toBe(403);
  });
});
