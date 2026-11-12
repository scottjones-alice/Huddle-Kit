import * as HttpStatusCodes from "stoker/http-status-codes";

import { callerOf } from "@/lib/caller";
import { isTrue } from "@/lib/schemas";
import { requireManager } from "@/services/access";
import { db } from "@/services/database";
import {
  createPerson as createPersonRow,
  getPersonDetail,
  linkPeople as linkPeopleRows,
  listPeople as listPeopleRows,
  updatePerson as updatePersonRow,
} from "@/services/people";
import type { AuthedRouteHandler } from "@/types";

import type {
  CreatePersonRoute,
  GetPersonRoute,
  LinkPeopleRoute,
  ListPeopleRoute,
  UpdatePersonRoute,
} from "./people.route";

export const listPeople: AuthedRouteHandler<ListPeopleRoute> = async (c) => {
  const caller = await callerOf(c);
  const { includeArchived, limit, offset, search } = c.req.valid("query");
  const rows = await listPeopleRows(db, caller, {
    includeArchived: isTrue(includeArchived),
    limit,
    offset,
    search,
  });
  return c.json({ people: rows }, HttpStatusCodes.OK);
};

export const createPerson: AuthedRouteHandler<CreatePersonRoute> = async (
  c
) => {
  requireManager(await callerOf(c));
  const person = await createPersonRow(
    db,
    c.get("organizationId"),
    c.req.valid("json")
  );
  return c.json(person, HttpStatusCodes.CREATED);
};

export const getPerson: AuthedRouteHandler<GetPersonRoute> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  return c.json(await getPersonDetail(db, caller, id), HttpStatusCodes.OK);
};

export const updatePerson: AuthedRouteHandler<UpdatePersonRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const person = await updatePersonRow(db, caller, id, c.req.valid("json"));
  return c.json(person, HttpStatusCodes.OK);
};

export const linkPeople: AuthedRouteHandler<LinkPeopleRoute> = async (c) => {
  requireManager(await callerOf(c));
  const { id } = c.req.valid("param");
  const row = await linkPeopleRows(
    db,
    c.get("organizationId"),
    id,
    c.req.valid("json")
  );
  return c.json(row, HttpStatusCodes.CREATED);
};
