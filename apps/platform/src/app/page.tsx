"use client";

import { FootballLoader } from "@alice/user-interface/components/football-loader";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { keys } from "@/lib/keys";
import { resolveDestination } from "@/lib/onboarding/destination";

const { NEXT_PUBLIC_SPLASH_MIN_MS: SPLASH_MIN_MS } = keys();

type Destination =
  | { status: "working" }
  | { path: string; status: "found" }
  | { status: "failed" };

export default function Home() {
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [destination, setDestination] = useState<Destination>({
    status: "working",
  });

  const {
    data: session,
    isPending: sessionPending,
    error: sessionError,
  } = authClient.useSession();

  const activeOrganizationId = session?.session.activeOrganizationId;
  const signedIn = session !== null && session !== undefined;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadingComplete(true);
    }, SPLASH_MIN_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  // Works out where this person belongs once we know who they are.
  useEffect(() => {
    let cancelled = false;
    const decide = async () => {
      if (!signedIn) {
        return;
      }
      try {
        const path = await resolveDestination(activeOrganizationId);
        if (!cancelled) {
          setDestination({ path, status: "found" });
        }
      } catch {
        if (!cancelled) {
          setDestination({ status: "failed" });
        }
      }
    };
    void decide();
    return () => {
      cancelled = true;
    };
  }, [signedIn, activeOrganizationId]);

  if (!loadingComplete || sessionPending) {
    return <FootballLoader label="Getting the team ready" variant="splash" />;
  }

  if (sessionError !== null && sessionError !== undefined) {
    return <p>Unable to verify your session.</p>;
  }

  if (!signedIn) {
    return redirect("/login");
  }

  if (destination.status === "failed") {
    return <p>We couldn&apos;t find your club. Refresh to try again.</p>;
  }

  if (destination.status === "working") {
    return <FootballLoader label="Finding your club" variant="splash" />;
  }

  return redirect(destination.path);
}
