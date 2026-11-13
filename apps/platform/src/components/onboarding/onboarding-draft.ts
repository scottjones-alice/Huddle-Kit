export interface OnboardingDraft {
  flow: "club" | "people";
  // The step the person was on, so a resumed visit can start there.
  stepId: string;
  data: FormData;
}

// Backend work: save the draft server-side (never in browser storage; these
// forms hold children's medical and contact details) and email a resume link.
export type SaveOnboardingDraft = (
  draft: OnboardingDraft
) => void | Promise<void>;
