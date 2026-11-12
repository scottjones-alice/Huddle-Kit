import { registrationSelectSchema } from "@alice/database/validation";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { callerOf } from "@/lib/caller";
import { db } from "@/services/database";
import {
  listRegistrations as listRegistrationRows,
  register as registerRow,
  updateRegistration as updateRegistrationRow,
} from "@/services/registrations";
import type { AuthedRouteHandler } from "@/types";

import type {
  ListRegistrationsRoute,
  RegisterRoute,
  UpdateRegistrationRoute,
} from "./registrations.route";

export const listRegistrations: AuthedRouteHandler<
  ListRegistrationsRoute
> = async (c) => {
  const caller = await callerOf(c);
  const rows = await listRegistrationRows(db, caller, c.req.valid("query"));
  return c.json(
    { registrations: registrationSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const register: AuthedRouteHandler<RegisterRoute> = async (c) => {
  const caller = await callerOf(c);
  const row = await registerRow(db, caller, c.req.valid("json"));
  return c.json(registrationSelectSchema.parse(row), HttpStatusCodes.CREATED);
};

export const updateRegistration: AuthedRouteHandler<
  UpdateRegistrationRoute
> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const row = await updateRegistrationRow(db, caller, id, c.req.valid("json"));
  return c.json(registrationSelectSchema.parse(row), HttpStatusCodes.OK);
};
