import {
  eventAttendance,
  events,
  feeCharges,
  fees,
  payments,
  people,
  registrations,
  teams,
} from "@alice/database";
import type { Database } from "@alice/database";
import { and, count, eq, gt, gte, lt, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { forbidden } from "@/lib/app-error";
import {
  canCoachTeam,
  requireManager,
  requireMoneyAccess,
} from "@/services/access";
import type { Caller } from "@/services/access";

const countOf = (rows: { total: number }[]): number => rows[0]?.total ?? 0;

/** A club admin's glance: how big the club is and what needs attention. Nothing about safeguarding or health. */
export const clubSummary = async (db: Database, caller: Caller) => {
  requireManager(caller);
  const org = caller.organizationId;
  const [activePeople, activeTeams, upcoming, pending] = await Promise.all([
    db
      .select({ total: count() })
      .from(people)
      .where(and(eq(people.organizationId, org), eq(people.isActive, true))),
    db
      .select({ total: count() })
      .from(teams)
      .where(and(eq(teams.organizationId, org), eq(teams.isActive, true))),
    db
      .select({ total: count() })
      .from(events)
      .where(
        and(
          eq(events.organizationId, org),
          eq(events.status, "scheduled"),
          gt(events.startsAt, new Date())
        )
      ),
    db
      .select({ total: count() })
      .from(registrations)
      .where(
        and(
          eq(registrations.organizationId, org),
          eq(registrations.status, "pending")
        )
      ),
  ]);
  return {
    activePeople: countOf(activePeople),
    activeTeams: countOf(activeTeams),
    pendingRegistrations: countOf(pending),
    upcomingEvents: countOf(upcoming),
  };
};

/** Per fee: how much was charged, how much has come in, and what is still owed. In minor units (pence). */
export const financeSummary = async (db: Database, caller: Caller) => {
  requireMoneyAccess(caller);
  const paid = sql<number>`coalesce(sum((select coalesce(sum(${payments.amountMinor}), 0) from ${payments} where ${payments.chargeId} = ${feeCharges.id})), 0)::int`;
  const rows = await db
    .select({
      charged: sql<number>`coalesce(sum(${feeCharges.amountMinor}) filter (where ${feeCharges.status} <> 'cancelled'), 0)::int`,
      charges: count(),
      currency: fees.currency,
      feeId: fees.id,
      name: fees.name,
      paid,
      waived: sql<number>`coalesce(sum(${feeCharges.amountMinor}) filter (where ${feeCharges.status} = 'waived'), 0)::int`,
    })
    .from(fees)
    .leftJoin(feeCharges, eq(feeCharges.feeId, fees.id))
    .where(eq(fees.organizationId, caller.organizationId))
    .groupBy(fees.id, fees.name, fees.currency)
    .orderBy(fees.name);
  return rows.map((row) => ({
    ...row,
    outstanding: Math.max(row.charged - row.waived - row.paid, 0),
  }));
};

export interface AttendanceFilters {
  from?: Date | undefined;
  teamId: string;
  to?: Date | undefined;
}

/** How often each person turned up to a team's events. Coaches of the team and club admins only. */
export const attendanceSummary = async (
  db: Database,
  caller: Caller,
  filters: AttendanceFilters
) => {
  if (!canCoachTeam(caller, filters.teamId)) {
    throw forbidden("You do not coach this team");
  }
  const conditions: (SQL | undefined)[] = [
    eq(events.organizationId, caller.organizationId),
    eq(events.teamId, filters.teamId),
    filters.from === undefined ? undefined : gte(events.startsAt, filters.from),
    filters.to === undefined ? undefined : lt(events.startsAt, filters.to),
  ];
  const rows = await db
    .select({
      absent: sql<number>`count(*) filter (where ${eventAttendance.status} = 'absent')::int`,
      excused: sql<number>`count(*) filter (where ${eventAttendance.status} = 'excused')::int`,
      firstName: people.firstName,
      lastName: people.lastName,
      late: sql<number>`count(*) filter (where ${eventAttendance.status} = 'late')::int`,
      personId: people.id,
      present: sql<number>`count(*) filter (where ${eventAttendance.status} = 'present')::int`,
    })
    .from(eventAttendance)
    .innerJoin(events, eq(events.id, eventAttendance.eventId))
    .innerJoin(people, eq(people.id, eventAttendance.personId))
    .where(and(...conditions))
    .groupBy(people.id, people.firstName, people.lastName)
    .orderBy(people.lastName, people.firstName);
  return rows;
};
