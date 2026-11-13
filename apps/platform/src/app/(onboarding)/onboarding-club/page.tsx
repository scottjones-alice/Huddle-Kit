import type { Metadata } from "next";

import { ClubOnboardingFlow } from "@/components/onboarding/club-onboarding-flow";

export const metadata: Metadata = { title: "Set up your club" };

export default function OnboardingClubPage() {
  return <ClubOnboardingFlow />;
}
