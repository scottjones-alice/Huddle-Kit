"use client";

import { FootballLoader } from "@alice/user-interface/components/football-loader";
import { redirect } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { isMemberRole } from "@/components/onboarding/options";
import type { MemberRole } from "@/components/onboarding/options";
import { PeopleOnboarding } from "@/components/onboarding/people-onboarding";
import { authClient } from "@/lib/auth-client";
import { createsChildren } from "@/lib/onboarding/member-steps";
import type { SavedDraft } from "@/lib/onboarding/save";
import {
  finishDraft,
  loadDraft,
  saveDraft,
  saveMemberStep,
} from "@/lib/onboarding/save";

type DraftState =
  | { status: "loading" }
  | { status: "outside" }
  | { draft: SavedDraft | null; status: "ready" };

// Steps that come after the one that creates the children.
const STEPS_AFTER_CHILDREN = new Set(["billing", "social", "confirm"]);

interface PeopleOnboardingFlowProps {
  invitedRole?: MemberRole;
}

const draftRole = (draft: SavedDraft | null): MemberRole | undefined => {
  const value = draft?.data.role;
  return typeof value === "string" && isMemberRole(value) ? value : undefined;
};

/** The people wizard, connected to the API: it saves each step and keeps a draft. */
export function PeopleOnboardingFlow({
  invitedRole,
}: PeopleOnboardingFlowProps) {
  const [state, setState] = useState<DraftState>({ status: "loading" });
  // The API creates children once. Going back and continuing must not repeat it.
  const childrenSaved = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // These steps are for club members. Anyone else goes back to the start,
      // which sends them to accept an invite or set up a club.
      const { data: clubs } = await authClient.organization.list();
      if ((clubs ?? []).length === 0) {
        if (!cancelled) {
          setState({ status: "outside" });
        }
        return;
      }
      const draft = await loadDraft("people");
      if (!cancelled) {
        childrenSaved.current = STEPS_AFTER_CHILDREN.has(draft?.stepId ?? "");
        setState({ draft, status: "ready" });
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "outside") {
    return redirect("/");
  }

  if (state.status === "loading") {
    return <FootballLoader label="Getting your details ready" variant="page" />;
  }

  return (
    <PeopleOnboarding
      initialRole={draftRole(state.draft)}
      initialStepId={state.draft?.stepId}
      initialValues={state.draft?.data}
      invitedRole={invitedRole}
      onFinish={async () => {
        await finishDraft("people");
      }}
      onSaveDraft={async ({ data, stepId }) => {
        await saveDraft("people", stepId, data);
      }}
      onSaveStep={async (stepId, data) => {
        const result = await saveMemberStep(stepId, data, {
          childrenSaved: childrenSaved.current,
        });
        if (result.ok && createsChildren(stepId)) {
          childrenSaved.current = true;
        }
        return result;
      }}
    />
  );
}
