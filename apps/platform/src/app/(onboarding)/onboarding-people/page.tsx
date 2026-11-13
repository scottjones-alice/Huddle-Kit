import type { Metadata } from "next";

import { isMemberRole } from "@/components/onboarding/options";
import { PeopleOnboardingFlow } from "@/components/onboarding/people-onboarding-flow";

export const metadata: Metadata = { title: "Join your club" };

// The page needs the invite's role before it can render the right steps, so
// it waits for searchParams instead of streaming a fallback in.
export const instant = false;

// The club sets the role when it invites someone, so the invite link carries
// it, for example /onboarding-people?role=parent. Without one, we ask.
export default async function OnboardingPeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  const { role } = await searchParams;
  const value = Array.isArray(role) ? role[0] : role;
  const invitedRole =
    value !== undefined && isMemberRole(value) ? value : undefined;

  // showDirectDebitFee stays off until the club's payment settings exist.
  return <PeopleOnboardingFlow invitedRole={invitedRole} />;
}
