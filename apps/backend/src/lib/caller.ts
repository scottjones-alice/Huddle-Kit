import type { Context } from "hono";

import { loadCaller } from "@/services/access";
import type { Caller } from "@/services/access";
import { db } from "@/services/database";
import type { AuthedBindings } from "@/types";

/** Who is calling and what they may do in the active club (see services/access). */
export const callerOf = async (c: Context<AuthedBindings>): Promise<Caller> =>
  await loadCaller(db, {
    organizationId: c.get("organizationId"),
    userId: c.get("userId"),
  });
