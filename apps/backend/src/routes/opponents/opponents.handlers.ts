import { opponents } from "@alice/database";
import { opponentSelectSchema } from "@alice/database/validation";
import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { conflict, notFound, forbidden } from "@/lib/app-error";
import { callerOf } from "@/lib/caller";
import { isTrue } from "@/lib/schemas";
import { isForeignKeyViolation, isUniqueViolation } from "@/lib/sql-errors";
import { isCoachOrManager } from "@/services/access";
import { insertInClub, listInClub, updateInClub } from "@/services/crud";
import { db } from "@/services/database";
import type { AuthedRouteHandler } from "@/types";

import type {
  CreateOpponentRoute,
  ListOpponentsRoute,
  UpdateOpponentRoute,
} from "./opponents.route";

const requireCoachOrManager = (allowed: boolean) => {
  if (!allowed) {
    throw forbidden("Only club admins and coaches can do this");
  }
};

/** Runs a write and turns the two database mistakes a caller can make into 409 and 404. */
const guarded = async <T>(write: () => Promise<T>): Promise<T> => {
  try {
    return await write();
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict("That opponent is already listed");
    }
    if (isForeignKeyViolation(error)) {
      throw notFound("Venue");
    }
    throw error;
  }
};

export const listOpponents: AuthedRouteHandler<ListOpponentsRoute> = async (
  c
) => {
  await callerOf(c);
  const { includeArchived } = c.req.valid("query");
  const rows = await listInClub(
    db,
    opponents,
    c.get("organizationId"),
    isTrue(includeArchived) ? undefined : eq(opponents.isActive, true)
  );
  return c.json(
    { opponents: opponentSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const createOpponent: AuthedRouteHandler<CreateOpponentRoute> = async (
  c
) => {
  requireCoachOrManager(isCoachOrManager(await callerOf(c)));
  const row = await guarded(
    async () =>
      await insertInClub(
        db,
        opponents,
        c.get("organizationId"),
        c.req.valid("json")
      )
  );
  return c.json(opponentSelectSchema.parse(row), HttpStatusCodes.CREATED);
};

export const updateOpponent: AuthedRouteHandler<UpdateOpponentRoute> = async (
  c
) => {
  requireCoachOrManager(isCoachOrManager(await callerOf(c)));
  const { id } = c.req.valid("param");
  const row = await guarded(
    async () =>
      await updateInClub(
        db,
        opponents,
        c.get("organizationId"),
        id,
        c.req.valid("json"),
        "Opponent"
      )
  );
  return c.json(opponentSelectSchema.parse(row), HttpStatusCodes.OK);
};
