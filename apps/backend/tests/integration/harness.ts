import { randomUUID } from "node:crypto";

import {
  createDatabase,
  members,
  organizations,
  roleAssignments,
  safeguardingChecks,
  users,
} from "@alice/database";
import type { RoleAssignmentRole } from "@alice/database";
import { eq } from "drizzle-orm";
import type { Hono } from "hono";

import createApp from "@/lib/create-app";

const testUrl = process.env.TEST_DATABASE_URL;
if (testUrl === undefined || testUrl === "") {
  throw new Error("TEST_DATABASE_URL is not set");
}

/** A connection to the test database, for seeding and for reading rows back. */
export const testDb = createDatabase({ url: testUrl });

// The routers differ in their bindings, and the harness only mounts and calls them.
// oxlint-disable-next-line typescript/no-explicit-any
type AnyRouter = Hono<any, any, any>;

const parseJson = (text: string): unknown => JSON.parse(text);

export interface TestMember {
  id: string;
  /** Sends a request as this person, in the test club. */
  request: (
    method: string,
    path: string,
    body?: unknown
  ) => Promise<{ body: unknown; status: number }>;
}

export interface MemberSeed {
  /** Better Auth role: owner, admin or member. */
  role?: string;
  /** Club jobs, such as coach or welfare_officer. */
  jobs?: RoleAssignmentRole[];
}

/**
 * A throwaway club with named members, and a way to call a router as each of
 * them. `cleanup()` removes the club and the people created for it.
 */
export const createTestClub = async <T extends Record<string, MemberSeed>>(
  router: AnyRouter,
  seeds: T
) => {
  const runId = randomUUID().slice(0, 8);
  const organizationId = randomUUID();
  await testDb.insert(organizations).values({
    createdAt: new Date(),
    id: organizationId,
    name: `Test FC ${runId}`,
    slug: `test-fc-${runId}`,
  });
  const app = createApp().route("/api/v1", router);

  const make = async (name: string, seed: MemberSeed): Promise<TestMember> => {
    const id = randomUUID();
    await testDb.insert(users).values({
      email: `${name}-${runId}@example.com`,
      id,
      name,
    });
    await testDb.insert(members).values({
      createdAt: new Date(),
      organizationId,
      role: seed.role ?? "member",
      userId: id,
    });
    await Promise.all(
      (seed.jobs ?? []).map(
        async (job) =>
          await testDb.insert(roleAssignments).values({
            organizationId,
            role: job,
            scope: "organization",
            userId: id,
          })
      )
    );
    return {
      id,
      request: async (method, path, body) => {
        const response = await app.request(`/api/v1${path}`, {
          body: body === undefined ? undefined : JSON.stringify(body),
          headers: {
            "content-type": "application/json",
            "x-test-org": organizationId,
            "x-test-user": id,
          },
          method,
        });
        const text = await response.text();
        return {
          body: text === "" ? null : parseJson(text),
          status: response.status,
        };
      },
    };
  };

  const entries = await Promise.all(
    Object.entries(seeds).map(
      async ([name, seed]) => [name, await make(name, seed)] as const
    )
  );
  // Object.fromEntries loses the names, and the seeds' keys are exactly the names.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const people = Object.fromEntries(entries) as { [K in keyof T]: TestMember };

  return {
    /** A request with no sign-in at all. */
    anonymous: async (method: string, path: string) => {
      const response = await app.request(`/api/v1${path}`, { method });
      return response.status;
    },
    cleanup: async () => {
      // Safeguarding records block deleting a club on purpose, so clear them first.
      await testDb
        .delete(safeguardingChecks)
        .where(eq(safeguardingChecks.organizationId, organizationId));
      await testDb
        .delete(organizations)
        .where(eq(organizations.id, organizationId));
      await Promise.all(
        entries.map(([, person]) =>
          testDb.delete(users).where(eq(users.id, person.id))
        )
      );
    },
    organizationId,
    people,
  };
};
