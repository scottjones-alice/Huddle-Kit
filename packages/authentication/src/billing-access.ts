import type { Database } from "@alice/database";

/** Roles that may manage a club's billing. Everyone else in the club may not. */
const BILLING_ROLES: ReadonlySet<string> = new Set(["owner", "admin"]);

/**
 * True when the user belongs to the club with the owner or admin role.
 * Better Auth stores several roles as a comma-separated list, so any match counts.
 */
export const isBillingManager = async (
  db: Database,
  { organizationId, userId }: { organizationId: string; userId: string }
): Promise<boolean> => {
  const membership = await db.query.members.findFirst({
    where: { organizationId, userId },
  });
  if (membership === undefined) {
    return false;
  }
  return membership.role
    .split(",")
    .some((role) => BILLING_ROLES.has(role.trim()));
};
