/**
 * The facts about a caller that access checks need, as plain data. Loading
 * them from the database is `load-access-context.ts`; deciding is
 * `authorize.ts`. Keeping the two apart makes every rule testable without a
 * database.
 */

/** One row of `role_assignments`, plus the teams it covers. */
export interface RoleGrant {
  /** Unknown or non-assignable roles are ignored, so a bad row grants nothing. */
  role: string;
  scope: "organization" | "teams";
  /** Only read when `scope` is `teams`. Empty means no teams, so no access. */
  teamIds: readonly string[];
  startsAt?: Date;
  /** Null or missing while the role still applies. */
  endsAt?: Date | null;
}

/** A child the caller is linked to through `person_relationships`. */
export interface LinkedChild {
  personId: string;
  /** Teams the child is on now. */
  teamIds: readonly string[];
  hasParentalResponsibility: boolean;
}

export interface AccessContext {
  userId: string;
  organizationId: string;
  /**
   * `members.role` for this organization. Better Auth may store several roles
   * separated by commas. Null means the caller is not a member: everything is
   * denied.
   */
  memberRole: string | null;
  assignments: readonly RoleGrant[];
  /** The caller's own `people` row in this organization, if they have one. */
  personId: string | null;
  /** Set only while the caller is on a team as a player. */
  player: { teamIds: readonly string[] } | null;
  linkedChildren: readonly LinkedChild[];
}

/** The record being acted on. The caller loads it and says where it belongs. */
export interface AccessTarget {
  /** The organization the record belongs to. Checked first, always. */
  organizationId: string;
  /**
   * The teams the record belongs to: a fixture has one; a player or their
   * medical record has the teams they are on. Team-scoped roles match on this.
   */
  teamIds?: readonly string[];
  /** The person the record is about, for guardian, player and welfare checks. */
  subjectPersonId?: string | null;
  /** Logins assigned to this case. Used for `safeguarding:read_assigned`. */
  assignedUserIds?: readonly string[];
  /**
   * The record is closed to changes, such as a completed fixture or a closed
   * case. Only club owners and admins can still change it.
   */
  locked?: boolean;
}
