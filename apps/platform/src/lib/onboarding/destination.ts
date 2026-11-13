import { authClient } from "@/lib/auth-client";
import { huddlekit } from "@/lib/huddle-kit";

export const CLUB_ONBOARDING_PATH = "/onboarding-club";
export const PEOPLE_ONBOARDING_PATH = "/onboarding-people";
const ORGANIZATIONS_PATH = "/organizations";

/** Club steps a club must finish. Payouts, team and billing finish on their own and never block. */
const REQUIRED_CLUB_STEPS = [
  "club",
  "location",
  "governance",
  "schedule",
  "fees",
  "social",
] as const;

/** Steps a member must finish before they are in the app. */
const REQUIRED_MEMBER_STEPS = ["role", "details"] as const;

const MANAGER_ROLES: ReadonlySet<string> = new Set(["owner", "admin"]);

const isFinished = (
  completed: readonly string[],
  required: readonly string[]
): boolean => {
  const done = new Set(completed);
  return required.every((step) => done.has(step));
};

/** Makes a club the active one, when the person belongs to one but none is active yet. */
const activateFirstClub = async (): Promise<string | null> => {
  const { data: clubs } = await authClient.organization.list();
  const [first] = clubs ?? [];
  if (first === undefined) {
    return null;
  }
  await authClient.organization.setActive({ organizationId: first.id });
  return first.id;
};

/** An invitation waiting for this person, if any, as the page that accepts it. */
const pendingInvitePath = async (): Promise<string | null> => {
  const { data: invitations } =
    await authClient.organization.listUserInvitations();
  const waiting = (invitations ?? []).find(
    (invitation) => invitation.status === "pending"
  );
  return waiting === undefined ? null : `/accept-invite/${waiting.id}`;
};

/**
 * Where a signed-in person should go next.
 * - No club yet and an invite waiting: the invite.
 * - No club and no invite: set up a club.
 * - Club owners and admins finish the club's setup first.
 * - Everyone else finishes their own details.
 * - Done: the club's dashboard.
 */
export const resolveDestination = async (
  activeOrganizationId: string | null | undefined
): Promise<string> => {
  const hasActiveClub =
    activeOrganizationId !== undefined &&
    activeOrganizationId !== null &&
    activeOrganizationId.length > 0;
  const organizationId = hasActiveClub
    ? activeOrganizationId
    : await activateFirstClub();
  if (organizationId === null) {
    return (await pendingInvitePath()) ?? CLUB_ONBOARDING_PATH;
  }

  const [{ data: role }, progress] = await Promise.all([
    authClient.organization.getActiveMemberRole(),
    huddlekit.onboarding.list(),
  ]);
  const manages = role !== null && MANAGER_ROLES.has(role.role);

  if (
    manages &&
    !isFinished(progress.organization.completed, REQUIRED_CLUB_STEPS)
  ) {
    return CLUB_ONBOARDING_PATH;
  }
  if (!manages && !isFinished(progress.user.completed, REQUIRED_MEMBER_STEPS)) {
    return PEOPLE_ONBOARDING_PATH;
  }

  const { data: organization } =
    await authClient.organization.getFullOrganization();
  const slug = organization?.slug ?? "";
  return slug.length === 0 ? ORGANIZATIONS_PATH : `/${slug}/dashboard`;
};
