/**
 * Writes one row to the append-only audit log. Call it whenever someone reads
 * or changes sensitive data (safeguarding, medical, consent, finance, roles),
 * in the same request as the action. The log never stores the data itself:
 * keep `metadata` to small non-sensitive context such as the names of the
 * fields that changed.
 *
 * Input is validated with the same schema as every other insert, so a bad
 * action name fails here with a clear error instead of at the database.
 */

import type { Database } from "./create-database";
import { auditEvents } from "./schema/governance/audit-events";
import { auditEventInsertSchema } from "./validation";
import type { NewAuditEventRecord } from "./validation";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const recordAuditEvent = async (
  db: Database,
  input: NewAuditEventRecord
) => {
  const values = auditEventInsertSchema.parse(input);
  const { metadata, ...rest } = values;

  // The schema accepts any JSON value; the column stores a plain object.
  if (metadata !== undefined && !isPlainObject(metadata)) {
    throw new Error("Audit metadata must be an object");
  }

  const [event] = await db
    .insert(auditEvents)
    .values({ ...rest, metadata })
    .returning();

  if (event === undefined) {
    throw new Error("Audit event was not saved");
  }

  return event;
};
