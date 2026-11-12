import * as HttpStatusCodes from "stoker/http-status-codes";

import { callerOf } from "@/lib/caller";
import { db } from "@/services/database";
import {
  attendanceSummary as attendanceRows,
  clubSummary as clubSummaryRow,
  financeSummary as financeRows,
} from "@/services/reports";
import type { AuthedRouteHandler } from "@/types";

import type {
  AttendanceSummaryRoute,
  ClubSummaryRoute,
  FinanceSummaryRoute,
} from "./reports.route";

export const clubSummary: AuthedRouteHandler<ClubSummaryRoute> = async (c) => {
  const caller = await callerOf(c);
  return c.json(await clubSummaryRow(db, caller), HttpStatusCodes.OK);
};

export const financeSummary: AuthedRouteHandler<FinanceSummaryRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  return c.json({ fees: await financeRows(db, caller) }, HttpStatusCodes.OK);
};

export const attendanceSummary: AuthedRouteHandler<
  AttendanceSummaryRoute
> = async (c) => {
  const caller = await callerOf(c);
  const { from, teamId, to } = c.req.valid("query");
  const rows = await attendanceRows(db, caller, {
    from: from === undefined ? undefined : new Date(from),
    teamId,
    to: to === undefined ? undefined : new Date(to),
  });
  return c.json({ people: rows }, HttpStatusCodes.OK);
};
