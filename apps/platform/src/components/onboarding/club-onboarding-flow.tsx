"use client";

import { FootballLoader } from "@alice/user-interface/components/football-loader";
import { useEffect, useState } from "react";

import { ClubOnboarding } from "@/components/onboarding/club-onboarding";
import type { SavedDraft } from "@/lib/onboarding/save";
import {
  finishDraft,
  loadDraft,
  saveClubStep,
  saveDraft,
} from "@/lib/onboarding/save";

type DraftState =
  | { status: "loading" }
  | { draft: SavedDraft | null; status: "ready" };

/** The club wizard, connected to the API: it saves each step and keeps a draft. */
export function ClubOnboardingFlow() {
  const [state, setState] = useState<DraftState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const draft = await loadDraft("club");
      if (!cancelled) {
        setState({ draft, status: "ready" });
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <FootballLoader label="Getting your club set up" variant="page" />;
  }

  return (
    <ClubOnboarding
      initialStepId={state.draft?.stepId}
      initialValues={state.draft?.data}
      onFinish={async () => {
        await finishDraft("club");
      }}
      onSaveDraft={async ({ data, stepId }) => {
        await saveDraft("club", stepId, data);
      }}
      onSaveStep={saveClubStep}
    />
  );
}
