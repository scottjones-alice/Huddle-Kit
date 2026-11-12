import {
  safeguardingCheckSelectSchema,
  safeguardingConcernSelectSchema,
  safeguardingNoteSelectSchema,
} from "@alice/database/validation";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { callerOf } from "@/lib/caller";
import { db } from "@/services/database";
import {
  addNote as addNoteRow,
  getConcern as getConcernRow,
  listChecks as listCheckRows,
  listConcerns as listConcernRows,
  raiseConcern as raiseConcernRow,
  recordCheck as recordCheckRow,
  updateCheck as updateCheckRow,
  updateConcern as updateConcernRow,
} from "@/services/safeguarding";
import type { AuthedRouteHandler } from "@/types";

import type {
  AddNoteRoute,
  GetConcernRoute,
  ListChecksRoute,
  ListConcernsRoute,
  RaiseConcernRoute,
  RecordCheckRoute,
  UpdateCheckRoute,
  UpdateConcernRoute,
} from "./safeguarding.route";

export const listChecks: AuthedRouteHandler<ListChecksRoute> = async (c) => {
  const caller = await callerOf(c);
  const rows = await listCheckRows(db, caller, c.req.valid("query"));
  return c.json(
    { checks: safeguardingCheckSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const recordCheck: AuthedRouteHandler<RecordCheckRoute> = async (c) => {
  const caller = await callerOf(c);
  const row = await recordCheckRow(db, caller, c.req.valid("json"));
  return c.json(
    safeguardingCheckSelectSchema.parse(row),
    HttpStatusCodes.CREATED
  );
};

export const updateCheck: AuthedRouteHandler<UpdateCheckRoute> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const row = await updateCheckRow(db, caller, id, c.req.valid("json"));
  return c.json(safeguardingCheckSelectSchema.parse(row), HttpStatusCodes.OK);
};

export const raiseConcern: AuthedRouteHandler<RaiseConcernRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const row = await raiseConcernRow(db, caller, c.req.valid("json"));
  return c.json(
    { id: row.id, openedAt: row.openedAt.toISOString() },
    HttpStatusCodes.CREATED
  );
};

export const listConcerns: AuthedRouteHandler<ListConcernsRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const rows = await listConcernRows(db, caller, c.req.valid("query"));
  return c.json(
    { concerns: safeguardingConcernSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const getConcern: AuthedRouteHandler<GetConcernRoute> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const result = await getConcernRow(db, caller, id);
  return c.json(
    {
      concern: safeguardingConcernSelectSchema.parse(result.concern),
      notes: safeguardingNoteSelectSchema.array().parse(result.notes),
    },
    HttpStatusCodes.OK
  );
};

export const updateConcern: AuthedRouteHandler<UpdateConcernRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const row = await updateConcernRow(db, caller, id, c.req.valid("json"));
  return c.json(safeguardingConcernSelectSchema.parse(row), HttpStatusCodes.OK);
};

export const addNote: AuthedRouteHandler<AddNoteRoute> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const { body } = c.req.valid("json");
  const row = await addNoteRow(db, caller, id, body);
  return c.json(
    safeguardingNoteSelectSchema.parse(row),
    HttpStatusCodes.CREATED
  );
};
