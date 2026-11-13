"use client";

import { Card } from "@alice/user-interface/components/card";
import { FootballLoader } from "@alice/user-interface/components/football-loader";
import { Progress } from "@alice/user-interface/components/progress";
import { cn } from "cn";
import { CheckIcon, ShieldIcon } from "lucide-react";
import * as React from "react";

import { FormError } from "@/components/auth/form-error";
import { AddressFields } from "@/components/onboarding/address-fields";
import { AvailabilityPicker } from "@/components/onboarding/availability-picker";
import { ChoiceCardGroup } from "@/components/onboarding/choice-card-group";
import { ClubGovernanceFields } from "@/components/onboarding/club-governance-fields";
import { ConsentItem } from "@/components/onboarding/consent-item";
import { ContactList } from "@/components/onboarding/contact-list";
import { DbsFields } from "@/components/onboarding/dbs-fields";
import {
  EmergencyContactFields,
  MedicalFields,
} from "@/components/onboarding/emergency-medical-fields";
import { FeeStructureFields } from "@/components/onboarding/fee-fields";
import { SelectField, TextField } from "@/components/onboarding/form-fields";
import { MediaConsentFields } from "@/components/onboarding/media-consent-fields";
import { OnboardingComplete } from "@/components/onboarding/onboarding-complete";
import type { SaveOnboardingDraft } from "@/components/onboarding/onboarding-draft";
import { OnboardingSaved } from "@/components/onboarding/onboarding-saved";
import {
  CLUB_ROLE_OPTIONS,
  CLUB_SECTION_OPTIONS,
  CLUB_TYPE_OPTIONS,
  MEMBER_ROLE_OPTIONS,
} from "@/components/onboarding/options";
import { PersonalDetailsFields } from "@/components/onboarding/personal-details-fields";
import { ReviewSummary } from "@/components/onboarding/review-summary";
import { slugify } from "@/components/onboarding/slugify";
import { SocialLinksFields } from "@/components/onboarding/social-links-fields";
import { FormSection, StepPanel } from "@/components/onboarding/step-panel";
import { StripeConnectCard } from "@/components/onboarding/stripe-connect-card";
import { useOnboardingSteps } from "@/components/onboarding/use-onboarding-steps";
import { WizardActions } from "@/components/onboarding/wizard-actions";
import { applyDraftValues } from "@/lib/onboarding/draft-values";

const STEPS = [
  { id: "club", label: "Club details" },
  { id: "location", label: "Location" },
  { id: "you", label: "About you" },
  { id: "emergency", label: "Emergency & medical" },
  { id: "safeguarding", label: "DBS & safeguarding" },
  { id: "governance", label: "Insurance & policies" },
  { id: "schedule", label: "Training schedule" },
  { id: "fees", label: "Fees" },
  { id: "payouts", label: "Get paid" },
  { id: "social", label: "Social media & photos" },
  { id: "team", label: "Invite your team" },
  { id: "confirm", label: "Confirm" },
] as const;

/** The result of saving a step. A message is shown to the person when it failed. */
export type SaveStepResult = { ok: true } | { message: string; ok: false };

interface ClubOnboardingProps {
  // Start on a step saved earlier with "Save and finish later".
  initialStepId?: string;
  // Saves the step the person is leaving. When it fails they stay on the step.
  onSaveStep?: (stepId: string, data: FormData) => Promise<SaveStepResult>;
  onSaveDraft?: SaveOnboardingDraft;
  // Answers saved earlier, put back into the form when it first shows.
  initialValues?: Record<string, string | string[]>;
  // Called once after the last step has saved.
  onFinish?: () => Promise<void>;
}

export function ClubOnboarding({
  initialStepId,
  initialValues,
  onFinish,
  onSaveDraft,
  onSaveStep,
}: ClubOnboardingProps) {
  const wizard = useOnboardingSteps(STEPS, initialStepId);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isSaved, setIsSaved] = React.useState(false);
  const [slug, setSlug] = React.useState("");
  const isSlugEdited = React.useRef(false);
  const [sameVenue, setSameVenue] = React.useState(true);
  const [isWelfareOfficer, setIsWelfareOfficer] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [stepError, setStepError] = React.useState<string | null>(null);

  const isActive = (id: string) => wizard.activeId === id;
  const handleBack = () => {
    wizard.back();
  };
  const handleEdit = (stepId: string) => {
    wizard.goTo(stepId);
  };
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSlugEdited.current) {
      setSlug(slugify(event.target.value));
    }
  };
  const handleSlugChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    isSlugEdited.current = true;
    setSlug(slugify(event.target.value));
  };
  const handleResume = () => {
    setIsSaved(false);
  };
  const saveDraft = async () => {
    const form = formRef.current;
    if (form === null) {
      return;
    }
    await onSaveDraft?.({
      data: new FormData(form),
      flow: "club",
      stepId: wizard.activeId,
    });
    setIsSaved(true);
  };

  React.useEffect(() => {
    const form = formRef.current;
    if (form !== null && initialValues !== undefined) {
      applyDraftValues(form, initialValues);
    }
  }, [initialValues]);

  // Saves the step, and finishes the flow after the last one. Returns a message
  // when something failed, or null when it all went through.
  const runStep = async (form: HTMLFormElement): Promise<string | null> => {
    try {
      const result = await onSaveStep?.(wizard.activeId, new FormData(form));
      if (result?.ok === false) {
        return result.message;
      }
      if (wizard.isLast) {
        await onFinish?.();
      }
      return null;
    } catch {
      return "Something went wrong. Please try again.";
    }
  };

  const handleContinue = async () => {
    const form = formRef.current;
    if (form === null) {
      return;
    }
    setStepError(null);
    setPending(true);
    const failure = await runStep(form);
    setPending(false);
    if (failure === null) {
      wizard.next();
    } else {
      setStepError(failure);
    }
  };

  const handleSaveForLater = () => {
    // If saving fails the person stays on the form with their answers.
    saveDraft().catch(() => null);
  };

  return (
    <section className="flex flex-1 items-center justify-center p-4 lg:p-8">
      <Card className="grid w-full max-w-5xl gap-0 overflow-hidden py-0 shadow-none lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <aside className="bg-muted text-foreground border-border hidden flex-col justify-between gap-10 border-r p-8 lg:flex">
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
                <ShieldIcon className="size-4" />
              </span>
              <span className="font-heading font-semibold">HuddleKit</span>
            </div>
            <div className="space-y-2">
              <h1 className="font-heading text-xl font-semibold">
                Set up your club
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                A few details about your club and you, so we can register it and
                keep every player safe.
              </p>
            </div>
            <ol className="space-y-4">
              {STEPS.map((step, index) => {
                const isDone = wizard.done || index < wizard.index;
                const isCurrent = !wizard.done && index === wizard.index;

                return (
                  <li key={step.id} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                        isDone &&
                          "bg-primary text-primary-foreground border-transparent",
                        isCurrent && "border-primary text-primary",
                        !(isDone || isCurrent) &&
                          "border-border text-muted-foreground"
                      )}
                    >
                      {isDone ? <CheckIcon className="size-3.5" /> : index + 1}
                    </span>
                    <span
                      aria-current={isCurrent ? "step" : undefined}
                      className={cn(
                        "text-sm",
                        isCurrent || isDone
                          ? "font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
          <p className="text-muted-foreground text-xs">
            You can change every answer later in club settings.
          </p>
        </aside>

        <div className="flex min-w-0 flex-col">
          <Progress
            value={wizard.progress}
            className="h-1 rounded-none lg:hidden"
          />
          <div className="flex flex-1 flex-col justify-center p-6 lg:p-10">
            {wizard.done ? (
              <OnboardingComplete
                className="mx-auto"
                title="Your club is set up"
                description="We will check your details and let you know as soon as the club is live. Anyone you invited will get an email."
                actionLabel="Go to dashboard"
                href="/"
              />
            ) : (
              <>
                {isSaved ? (
                  <OnboardingSaved
                    className="mx-auto"
                    onResume={handleResume}
                  />
                ) : null}
                <form
                  ref={formRef}
                  hidden={isSaved}
                  method="post"
                  noValidate
                  className="flex flex-col gap-8"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleContinue();
                  }}
                >
                  <p className="text-muted-foreground text-xs font-medium tabular-nums lg:hidden">
                    Step {wizard.index + 1} of {wizard.total}
                  </p>

                  <StepPanel
                    active={isActive("club")}
                    stepId="club"
                    title="Tell us about your club"
                    description="This is how players and parents will find and recognise you."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        id="club-name"
                        name="club-name"
                        label="Club name"
                        required
                        onChange={handleNameChange}
                        className="sm:col-span-2"
                      />
                      <TextField
                        id="club-slug"
                        name="club-slug"
                        label="Club web address"
                        value={slug}
                        onChange={handleSlugChange}
                        placeholder="riverside-fc"
                        hint="Letters, numbers and hyphens. Filled in from your club name."
                        required
                        className="sm:col-span-2"
                      />
                      <SelectField
                        id="club-type"
                        name="club-type"
                        label="Type of club"
                        options={CLUB_TYPE_OPTIONS}
                        required
                      />
                      <TextField
                        id="club-founded"
                        name="club-founded"
                        label="Year founded"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="1998"
                        optional
                      />
                      <TextField
                        id="club-county-fa"
                        name="club-county-fa"
                        label="County FA"
                        placeholder="For example Sheffield & Hallamshire FA"
                        required
                      />
                      <TextField
                        id="club-affiliation"
                        name="club-affiliation"
                        label="FA affiliation number"
                        optional
                      />
                      <TextField
                        id="club-leagues"
                        name="club-leagues"
                        label="Leagues you play in"
                        optional
                        className="sm:col-span-2"
                      />
                      <TextField
                        id="club-logo"
                        name="club-logo"
                        label="Club badge"
                        type="file"
                        accept="image/*"
                        optional
                        className="sm:col-span-2"
                      />
                    </div>
                    <FormSection
                      title="Which sections does the club run?"
                      description="Pick all that apply."
                    >
                      <ChoiceCardGroup
                        name="club-sections"
                        legend="Club sections"
                        type="checkbox"
                        columns={2}
                        options={CLUB_SECTION_OPTIONS}
                      />
                    </FormSection>
                  </StepPanel>

                  <StepPanel
                    active={isActive("location")}
                    stepId="location"
                    title="Where is your club based?"
                    description="Your official address and where the teams train."
                  >
                    <FormSection title="Club address">
                      <AddressFields prefix="club-hq" />
                    </FormSection>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        id="club-phone"
                        name="club-phone"
                        label="Club phone number"
                        type="tel"
                        required
                      />
                      <TextField
                        id="club-email"
                        name="club-email"
                        label="Club email"
                        type="email"
                        required
                      />
                      <TextField
                        id="club-website"
                        name="club-website"
                        label="Website"
                        placeholder="www.yourclub.co.uk"
                        optional
                        className="sm:col-span-2"
                      />
                    </div>
                    <FormSection title="Training ground">
                      <ConsentItem
                        title="Same as the club address"
                        description="Turn off to add a different home ground or training venue."
                        checked={sameVenue}
                        onCheckedChange={setSameVenue}
                      />
                      {sameVenue ? null : (
                        <>
                          <TextField
                            id="club-venue-name"
                            name="club-venue-name"
                            label="Ground or pitch name"
                          />
                          <AddressFields prefix="club-venue" />
                        </>
                      )}
                    </FormSection>
                  </StepPanel>

                  <StepPanel
                    active={isActive("you")}
                    stepId="you"
                    title="Tell us about you"
                    description="You will be the main owner of the club account."
                  >
                    <PersonalDetailsFields prefix="owner" />
                    <SelectField
                      id="owner-role"
                      name="owner-role"
                      label="Your role at the club"
                      options={CLUB_ROLE_OPTIONS}
                      required
                    />
                    <FormSection title="Your home address">
                      <AddressFields prefix="owner-home" />
                    </FormSection>
                  </StepPanel>

                  <StepPanel
                    active={isActive("emergency")}
                    stepId="emergency"
                    title="Emergency contact and medical"
                    description="Who should we call if something happens to you at the club?"
                  >
                    <FormSection title="Emergency contacts">
                      <EmergencyContactFields prefix="owner" />
                    </FormSection>
                    <FormSection title="Medical information">
                      <MedicalFields prefix="owner" />
                    </FormSection>
                  </StepPanel>

                  <StepPanel
                    active={isActive("safeguarding")}
                    stepId="safeguarding"
                    title="DBS and safeguarding"
                    description="Anyone running a club with children needs a valid DBS check."
                  >
                    <FormSection title="Your DBS check">
                      <DbsFields prefix="owner" />
                    </FormSection>
                    <FormSection title="Welfare officer">
                      <ConsentItem
                        title="I am the club's welfare officer"
                        description="Turn off if someone else holds the role."
                        checked={isWelfareOfficer}
                        onCheckedChange={setIsWelfareOfficer}
                      />
                      {isWelfareOfficer ? null : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <TextField
                            id="welfare-name"
                            name="welfare-name"
                            label="Welfare officer name"
                          />
                          <TextField
                            id="welfare-email"
                            name="welfare-email"
                            label="Welfare officer email"
                            type="email"
                          />
                        </div>
                      )}
                    </FormSection>
                  </StepPanel>

                  <StepPanel
                    active={isActive("governance")}
                    stepId="governance"
                    title="Insurance and policies"
                    description="Parents and the county FA will expect to see these. You can add documents later."
                  >
                    <ClubGovernanceFields />
                  </StepPanel>

                  <StepPanel
                    active={isActive("schedule")}
                    stepId="schedule"
                    title="When does the club train?"
                    description="Tick every slot that usually has a session or match."
                  >
                    <AvailabilityPicker
                      name="club-schedule"
                      legend="Club sessions and matches"
                    />
                    <AvailabilityPicker
                      name="owner-availability"
                      legend="When are you free for club admin?"
                      description="Used for calls and committee meetings."
                    />
                  </StepPanel>

                  <StepPanel
                    active={isActive("fees")}
                    stepId="fees"
                    title="What do members pay?"
                    description="Set your standard fees. You can change them, or set different ones for a team, later."
                  >
                    <FeeStructureFields />
                  </StepPanel>

                  <StepPanel
                    active={isActive("payouts")}
                    stepId="payouts"
                    title="Get paid"
                    description="Connect Stripe so member payments reach the club's bank account."
                  >
                    <StripeConnectCard />
                  </StepPanel>

                  <StepPanel
                    active={isActive("social")}
                    stepId="social"
                    title="Social media and photos"
                    description="Where your club shares news, and how it handles pictures of members."
                  >
                    <FormSection title="Club accounts">
                      <SocialLinksFields prefix="club" />
                    </FormSection>
                    <FormSection title="Your own accounts">
                      <SocialLinksFields prefix="owner" />
                    </FormSection>
                    <FormSection
                      title="Your consent"
                      description="Whether the club may post pictures and videos of you."
                    >
                      <MediaConsentFields prefix="owner-media" subject="you" />
                    </FormSection>
                    <FormSection title="Club photo policy">
                      <div className="flex flex-col gap-3">
                        <ConsentItem
                          name="club-policy-consent"
                          defaultChecked
                          title="Ask for consent before posting under-18s"
                          description="Members only appear on social media when a parent or guardian agrees."
                        />
                        <ConsentItem
                          name="club-policy-results"
                          defaultChecked
                          title="Publish results and match reports"
                          description="Scores and reports do not include photos."
                        />
                        <ConsentItem
                          name="club-policy-no-private-messages"
                          defaultChecked
                          title="No private one-to-one messages between adults and under-18s"
                          description="Messages happen in group chats or with a parent copied in."
                        />
                        <ConsentItem
                          name="club-policy-copy-parents"
                          defaultChecked
                          title="Parents are copied on messages to under-18s"
                          description="A parent or guardian can see anything sent to their child."
                        />
                      </div>
                    </FormSection>
                  </StepPanel>

                  <StepPanel
                    active={isActive("team")}
                    stepId="team"
                    title="Invite your team"
                    description="Choose whether each person joins as staff, a player or a parent. They get a link that already knows their role, so they are never asked again. You can skip this."
                  >
                    <ContactList
                      idPrefix="invite"
                      rowLabel="Invite"
                      addLabel="Invite another person"
                      defaultRows={2}
                      minRows={0}
                      primary={{
                        label: "Email",
                        placeholder: "coach@yourclub.co.uk",
                        type: "email",
                      }}
                      select={{ label: "Role", options: MEMBER_ROLE_OPTIONS }}
                    />
                  </StepPanel>

                  <StepPanel
                    active={isActive("confirm")}
                    stepId="confirm"
                    title="Confirm and finish"
                    description="Check you are happy with the following, then create your club."
                  >
                    <ReviewSummary
                      formRef={formRef}
                      active={isActive("confirm")}
                      excludeStepId="confirm"
                      onEdit={handleEdit}
                    />
                    <div className="flex flex-col gap-3">
                      <ConsentItem
                        name="confirm-authority"
                        title="I can act for this club"
                        description="I am authorised to register the club and invite people."
                      />
                      <ConsentItem
                        name="confirm-safeguarding"
                        title="The club has a safeguarding policy"
                        description="It is available to every parent, player and volunteer."
                      />
                      <ConsentItem
                        name="confirm-terms"
                        title="I accept the terms and privacy notice"
                        description="Including how member data is stored and shared."
                      />
                    </div>
                  </StepPanel>

                  <FormError message={stepError} />
                  {pending ? (
                    <FootballLoader
                      variant="inline"
                      label={wizard.isLast ? "Creating your club" : "Saving"}
                    />
                  ) : null}
                  <WizardActions
                    nextDisabled={pending}
                    isFirst={wizard.isFirst}
                    isLast={wizard.isLast}
                    onBack={handleBack}
                    finishLabel="Create club"
                    onSaveForLater={handleSaveForLater}
                  />
                </form>
              </>
            )}
          </div>
        </div>
      </Card>
    </section>
  );
}
