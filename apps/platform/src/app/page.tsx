"use client";

import { FootballLoader } from "@alice/user-interface/components/football-loader";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

export default function Home() {
  const [loadingComplete, setLoadingComplete] = useState(false);

  const {
    data: session,
    isPending: sessionPending,
    error: sessionError,
  } = authClient.useSession();

  const { data: activeOrganization, isPending: organizationPending } =
    authClient.useActiveOrganization();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadingComplete(true);
    }, 20_000);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  if (!loadingComplete || sessionPending) {
    return <FootballLoader label="Getting the team ready" variant="splash" />;
  }

  if (sessionError !== null && sessionError !== undefined) {
    return <p>Unable to verify your session.</p>;
  }

  if (session === null || session === undefined) {
    return redirect("/login");
  }

  const onboardingComplete = false;
  const onboardingStep = "create-organization";

  if (!onboardingComplete) {
    return redirect(`/onboarding/${onboardingStep}`);
  }

  if (organizationPending) {
    return <FootballLoader label="Finding your club" variant="splash" />;
  }

  const slug = activeOrganization?.slug;

  if (slug === null || slug === undefined || slug.length === 0) {
    return redirect("/organizations");
  }

  return redirect(`/${slug}/dashboard`);
}
