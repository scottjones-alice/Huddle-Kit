import type { Database } from "@alice/database";
import { and, eq } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

import { notFound } from "@/lib/app-error";

/** Any table that belongs to one club and has an id. */
export type ClubTable = PgTable & {
  id: PgColumn;
  organizationId: PgColumn;
};

type Values = Record<string, unknown>;

/** Rows of a club table, scoped to the club. Filters are ANDed on. */
export const listInClub = async (
  db: Database,
  table: ClubTable,
  organizationId: string,
  ...filters: (SQL | undefined)[]
): Promise<unknown[]> =>
  await db
    .select()
    .from(table)
    .where(and(eq(table.organizationId, organizationId), ...filters));

/** One row by id in the club, or a 404 (the same for "missing" and "someone else's"). */
export const getInClub = async (
  db: Database,
  table: ClubTable,
  organizationId: string,
  id: string,
  what: string
): Promise<unknown> => {
  const [row] = await db
    .select()
    .from(table)
    .where(and(eq(table.organizationId, organizationId), eq(table.id, id)));
  if (row === undefined) {
    throw notFound(what);
  }
  return row;
};

export const insertInClub = async (
  db: Database,
  table: ClubTable,
  organizationId: string,
  values: Values
): Promise<unknown> => {
  const [row] = await db
    .insert(table)
    .values({ ...values, organizationId })
    .returning();
  if (row === undefined) {
    throw new Error("Insert returned no row");
  }
  return row;
};

export const updateInClub = async (
  db: Database,
  table: ClubTable,
  organizationId: string,
  id: string,
  values: Values,
  what: string
): Promise<unknown> => {
  if (Object.keys(values).length === 0) {
    return await getInClub(db, table, organizationId, id, what);
  }
  const [row] = await db
    .update(table)
    .set(values)
    .where(and(eq(table.organizationId, organizationId), eq(table.id, id)))
    .returning();
  if (row === undefined) {
    throw notFound(what);
  }
  return row;
};
