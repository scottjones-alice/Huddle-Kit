import * as HttpStatusCodes from "stoker/http-status-codes";

import { conflict } from "@/lib/app-error";
import { callerOf } from "@/lib/caller";
import { requireManager } from "@/services/access";
import { getClubOverview } from "@/services/club";
import { SlugTakenError, saveClubStep } from "@/services/club-onboarding";
import { db } from "@/services/database";
import type { AuthedRouteHandler } from "@/types";

import type { GetClubRoute, SaveClubRoute } from "./club.route";

export const getClub: AuthedRouteHandler<GetClubRoute> = async (c) => {
  await callerOf(c);
  const overview = await getClubOverview(db, c.get("organizationId"));
  return c.json(overview, HttpStatusCodes.OK);
};

export const saveClub: AuthedRouteHandler<SaveClubRoute> = async (c) => {
  requireManager(await callerOf(c));
  const organizationId = c.get("organizationId");
  try {
    await saveClubStep(db, organizationId, c.req.valid("json"));
  } catch (error) {
    if (error instanceof SlugTakenError) {
      throw conflict(error.message);
    }
    throw error;
  }
  return c.json(await getClubOverview(db, organizationId), HttpStatusCodes.OK);
};
