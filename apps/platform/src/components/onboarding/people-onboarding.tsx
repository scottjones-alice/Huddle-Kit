"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@alice/user-interface/components/alert";
import { Button } from "@alice/user-interface/components/button";
import { FootballLoader } from "@alice/user-interface/components/football-loader";
import { Progress } from "@alice/user-interface/components/progress";
import { LandmarkIcon, PlusIcon, Trash2Icon, UsersIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { FormError } from "@/components/auth/form-error";
import { AddressFields } from "@/components/onboarding/address-fields";
import { AvailabilityPicker } from "@/components/onboarding/availability-picker";
import { ChildDetailsFields } from "@/components/onboarding/child-details-fields";
import { ChoiceCardGroup } from "@/components/onboarding/choice-card-group";
import { ChatConsentFields } from "@/components/onboarding/communication-consent-fields";
import { ConsentItem } from "@/components/onboarding/consent-item";
import { DbsFields } from "@/components/onboarding/dbs-fields";
import {
  EmergencyContactFields,
  MedicalFields,
} from "@/components/onboarding/emergency-medical-fields";
import { SelectField, TextField } from "@/components/onboarding/form-fields";
import { KitSizeFields } from "@/components/onboarding/kit-size-fields";
import { MediaConsentFields } from "@/components/onboarding/media-consent-fields";
import { OnboardingComplete } from "@/components/onboarding/onboarding-complete";
import type { SaveOnboardingDraft } from "@/components/onboarding/onboarding-draft";
import { OnboardingSaved } from "@/components/onboarding/onboarding-saved";
import {
  isMemberRole,
  MEMBER_ROLE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  POSITION_OPTIONS,
  STAFF_ROLE_OPTIONS,
} from "@/components/onboarding/options";
import type { MemberRole } from "@/components/onboarding/options";
import { OtherGuardianFields } from "@/components/onboarding/other-guardian-fields";
import { PersonalDetailsFields } from "@/components/onboarding/personal-details-fields";
import {
  CoachingQualificationFields,
  ReferenceFields,
} from "@/components/onboarding/qualification-fields";
import { ReviewSummary } from "@/components/onboarding/review-summary";
import { SocialLinksFields } from "@/components/onboarding/social-links-fields";
import { FormSection, StepPanel } from "@/components/onboarding/step-panel";
import { TravelConsentFields } from "@/components/onboarding/travel-consent-fields";
import { useOnboardingSteps } from "@/components/onboarding/use-onboarding-steps";
import type { OnboardingStep } from "@/components/onboarding/use-onboarding-steps";
import { WizardActions } from "@/components/onboarding/wizard-actions";
import { applyDraftValues } from "@/lib/onboarding/draft-values";

type Role = MemberRole;

const DIRECT_DEBIT_VALUE = "direct-debit";

interface ChildEntry {
  id: number;
  name: string;
}

const ROLE: OnboardingStep = { id: "role", label: "Your role" };
const DETAILS: OnboardingStep = { id: "details", label: "About you" };
const ADDRESS: OnboardingStep = { id: "address", label: "Address" };
const SAFETY: OnboardingStep = { id: "safety", label: "Emergency & medical" };
const DBS: OnboardingStep = {
  id: "dbs",
  label: "DBS, badges & references",
};
const AVAILABILITY: OnboardingStep = {
  id: "availability",
  label: "Availability",
};
const CHILDREN: OnboardingStep = { id: "children", label: "Your children" };
const PERMISSIONS: OnboardingStep = {
  id: "permissions",
  label: "Photos, travel & chat",
};
const BILLING: OnboardingStep = { id: "billing", label: "Payments" };
const SOCIAL: OnboardingStep = {
  id: "social",
  label: "Social media, photos & chat",
};
const CONFIRM: OnboardingStep = { id: "confirm", label: "Confirm" };

function getSteps(
  role: Role | "",
  alsoPlays: boolean,
  volunteers: boolean
): OnboardingStep[] {
  if (role === "staff") {
    return [
      ROLE,
      DETAILS,
      ADDRESS,
      SAFETY,
      DBS,
      AVAILABILITY,
      ...(alsoPlays ? [BILLING] : []),
      SOCIAL,
      CONFIRM,
    ];
  }
  if (role === "player") {
    return [
      ROLE,
      DETAILS,
      ADDRESS,
      SAFETY,
      AVAILABILITY,
      BILLING,
      SOCIAL,
      CONFIRM,
    ];
  }
  if (role === "parent") {
    return [
      ROLE,
      DETAILS,
      ADDRESS,
      SAFETY,
      ...(alsoPlays ? [AVAILABILITY] : []),
      ...(volunteers ? [DBS] : []),
      CHILDREN,
      PERMISSIONS,
      BILLING,
      SOCIAL,
      CONFIRM,
    ];
  }
  return [ROLE];
}

function getChildLabel(child: ChildEntry, index: number): string {
  return child.name.trim() || `Child ${index + 1}`;
}

function PlayingFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField
        id="player-position"
        name="player-position"
        label="Preferred position"
        options={POSITION_OPTIONS}
        optional
      />
      <TextField
        id="player-experience"
        name="player-experience"
        label="Previous clubs"
        optional
      />
      <div className="sm:col-span-2">
        <KitSizeFields prefix="player" />
      </div>
    </div>
  );
}

const COMPLETE_COPY: Record<Role, { title: string; description: string }> = {
  parent: {
    description:
      "Your children are registered. The club will be in touch about the next training session.",
    title: "You are all signed up",
  },
  player: {
    description:
      "Your details are with the club. You will see fixtures and training as soon as you are added to a team.",
    title: "Welcome to the squad",
  },
  staff: {
    description:
      "Your details are with the club. The club will confirm your DBS check before you start.",
    title: "Welcome to the team",
  },
};

interface PeopleOnboardingProps {
  // Set when the club chose a role in the invite. Skips the role question.
  invitedRole?: Role;
  // The role chosen before the person saved and left. They can still change it.
  initialRole?: Role;
  // Show the Direct Debit processing fee notice. Some clubs absorb the fee,
  // so it is off by default. Later this comes from the club's payment settings.
  showDirectDebitFee?: boolean;
  // Start on a step saved earlier with "Save and finish later".
  initialStepId?: string;
  onSaveDraft?: SaveOnboardingDraft;
  // Saves the step the person is leaving. When it fails they stay on the step.
  onSaveStep?: (
    stepId: string,
    data: FormData
  ) => Promise<{ ok: true } | { message: string; ok: false }>;
  // Answers saved earlier, put back into the form when it first shows.
  initialValues?: Record<string, string | string[]>;
  // Called once after the last step has saved.
  onFinish?: () => Promise<void>;
}

export function PeopleOnboarding({
  invitedRole,
  initialRole,
  showDirectDebitFee = false,
  initialStepId,
  initialValues,
  onFinish,
  onSaveDraft,
  onSaveStep,
}: PeopleOnboardingProps) {
  const isInvited = invitedRole !== undefined;
  const [role, setRole] = React.useState<Role | "">(
    invitedRole ?? initialRole ?? ""
  );
  const [alsoPlays, setAlsoPlays] = React.useState(false);
  const [volunteers, setVolunteers] = React.useState(false);
  const [secondPayer, setSecondPayer] = React.useState(false);
  const [sameBillingAddress, setSameBillingAddress] = React.useState(true);
  const [paymentMethod, setPaymentMethod] = React.useState("");
  const [childList, setChildList] = React.useState<ChildEntry[]>([
    { id: 0, name: "" },
  ]);
  const nextChildId = React.useRef(1);

  const steps = React.useMemo(
    () =>
      getSteps(role, alsoPlays, volunteers).filter(
        (step) => !(isInvited && step.id === ROLE.id)
      ),
    [role, alsoPlays, volunteers, isInvited]
  );
  const wizard = useOnboardingSteps(steps, initialStepId);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isSaved, setIsSaved] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [stepError, setStepError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const form = formRef.current;
    if (form !== null && initialValues !== undefined) {
      applyDraftValues(form, initialValues);
    }
  }, [initialValues]);

  const paysOwnFees = role === "player" || (role === "staff" && alsoPlays);
  const isActive = (id: string) => wizard.activeId === id;
  const hasStep = (id: string) => steps.some((step) => step.id === id);

  const addChild = () => {
    const id = nextChildId.current;
    nextChildId.current += 1;
    setChildList((current) => [...current, { id, name: "" }]);
  };

  const removeChild = (id: number) => {
    setChildList((current) => current.filter((child) => child.id !== id));
  };

  const renameChild = (id: number, name: string) => {
    setChildList((current) =>
      current.map((child) => (child.id === id ? { ...child, name } : child))
    );
  };

  const handleRoleChange = (value: string) => {
    if (isMemberRole(value)) {
      setRole(value);
    }
  };

  const handleBack = () => {
    wizard.back();
  };

  const handleEdit = (stepId: string) => {
    wizard.goTo(stepId);
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
      flow: "people",
      stepId: wizard.activeId,
    });
    setIsSaved(true);
  };

  // Saves the step, and finishes the flow after the last one. Returns a message
  // when something failed, or null when it all went through.
  const runStep = async (form: HTMLFormElement): Promise<string | null> => {
    try {
      const answers = new FormData(form);
      // The role is a choice card or comes from the invite, so set it here.
      answers.set("role", role);
      const result = await onSaveStep?.(wizard.activeId, answers);
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
    <section className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <UsersIcon className="size-4" />
          </span>
          <span className="font-heading font-semibold">HuddleKit</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground hidden text-xs font-medium tabular-nums sm:inline">
            Step {wizard.done ? wizard.total : wizard.index + 1}
            {role ? ` of ${wizard.total}` : ""}
          </span>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Skip setup</Link>
          </Button>
        </div>
      </header>

      <Progress value={wizard.progress} className="h-1 rounded-none" />

      <div className="flex flex-1 items-center justify-center px-4 py-10 lg:px-8">
        {wizard.done && role ? (
          <OnboardingComplete
            title={COMPLETE_COPY[role].title}
            description={COMPLETE_COPY[role].description}
            actionLabel="Go to dashboard"
            href="/"
          />
        ) : (
          <>
            {isSaved ? <OnboardingSaved onResume={handleResume} /> : null}
            <form
              ref={formRef}
              hidden={isSaved}
              method="post"
              noValidate
              className="flex w-full max-w-xl flex-col gap-8"
              onSubmit={(event) => {
                event.preventDefault();
                void handleContinue();
              }}
            >
              {isInvited ? (
                <p className="text-muted-foreground text-sm">
                  You have been invited to join as{" "}
                  <span className="text-foreground font-medium">
                    {MEMBER_ROLE_OPTIONS.find(
                      (option) => option.value === role
                    )?.label.toLowerCase()}
                  </span>
                  .
                </p>
              ) : (
                <StepPanel
                  active={isActive("role")}
                  stepId="role"
                  title="How are you joining?"
                  description="We will ask for the right details for your role."
                >
                  <ChoiceCardGroup
                    name="role"
                    legend="Your role"
                    options={MEMBER_ROLE_OPTIONS}
                    value={role}
                    onValueChange={handleRoleChange}
                  />
                </StepPanel>
              )}

              <StepPanel
                active={isActive("details")}
                stepId="details"
                title="Tell us about you"
                description="Your name and contact details, exactly as they appear on official documents."
              >
                <PersonalDetailsFields prefix="me" />
                {role === "staff" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      id="staff-role"
                      name="staff-role"
                      label="Your role at the club"
                      options={STAFF_ROLE_OPTIONS}
                      required
                    />
                    <TextField
                      id="staff-teams"
                      name="staff-teams"
                      label="Teams you work with"
                      placeholder="For example Under 12s Lions"
                      optional
                    />
                  </div>
                ) : null}
                {role === "staff" ? (
                  <FormSection title="Do you play too?">
                    <ConsentItem
                      title="I also play for the club"
                      description="We will ask for your playing details and how you will pay."
                      checked={alsoPlays}
                      onCheckedChange={setAlsoPlays}
                    />
                    {alsoPlays ? <PlayingFields /> : null}
                  </FormSection>
                ) : null}
                {role === "player" ? <PlayingFields /> : null}
                {role === "parent" ? (
                  <FormSection title="Anything else?">
                    <ConsentItem
                      title="I also play for the club"
                      description="We will ask for your availability too."
                      checked={alsoPlays}
                      onCheckedChange={setAlsoPlays}
                    />
                    <ConsentItem
                      title="I help out as a volunteer"
                      description="Coaching, managing, driving or running the tuck shop. We will ask for DBS details."
                      checked={volunteers}
                      onCheckedChange={setVolunteers}
                    />
                  </FormSection>
                ) : null}
                {role === "parent" ? (
                  <FormSection title="Other parent or guardian">
                    <OtherGuardianFields prefix="guardian" />
                  </FormSection>
                ) : null}
              </StepPanel>

              <StepPanel
                active={isActive("address")}
                stepId="address"
                title="Where do you live?"
                description="Your home address, used for safeguarding records and fixtures near you."
              >
                <AddressFields prefix="me-home" />
              </StepPanel>

              <StepPanel
                active={isActive("safety")}
                stepId="safety"
                title="Emergency contact and medical"
                description="Who should we call if something happens to you?"
              >
                <FormSection title="Emergency contacts">
                  <EmergencyContactFields prefix="me" />
                </FormSection>
                <FormSection title="Medical information">
                  <MedicalFields prefix="me" />
                </FormSection>
              </StepPanel>

              {hasStep("dbs") ? (
                <StepPanel
                  active={isActive("dbs")}
                  stepId="dbs"
                  title="DBS, badges and references"
                  description="Needed for anyone working or volunteering with children."
                >
                  <FormSection title="DBS check">
                    <DbsFields prefix="me" />
                  </FormSection>
                  {role === "staff" ? (
                    <FormSection
                      title="Coaching badges"
                      description="Add any coaching or refereeing qualifications. Optional."
                    >
                      <CoachingQualificationFields prefix="me" />
                    </FormSection>
                  ) : null}
                  <FormSection
                    title="References"
                    description="Two people who can speak about you working with children."
                  >
                    <ReferenceFields prefix="me" />
                  </FormSection>
                </StepPanel>
              ) : null}

              {hasStep("availability") ? (
                <StepPanel
                  active={isActive("availability")}
                  stepId="availability"
                  title="When are you available?"
                  description={
                    role === "staff"
                      ? `Tick the slots you can usually coach${alsoPlays ? ", help out or play" : " or help out"}.`
                      : "Tick the slots you can usually train and play."
                  }
                >
                  <AvailabilityPicker
                    name="me-availability"
                    legend="Weekly availability"
                  />
                  <TextField
                    id="me-availability-notes"
                    name="me-availability-notes"
                    label="Anything we should know?"
                    placeholder="For example away on the first weekend of each month"
                    optional
                  />
                </StepPanel>
              ) : null}

              {hasStep("children") ? (
                <StepPanel
                  active={isActive("children")}
                  stepId="children"
                  title="Your children"
                  description="Add every child you are registering. You can add more later."
                >
                  {childList.map((child, index) => (
                    <div
                      key={child.id}
                      className="border-input flex flex-col gap-6 rounded-3xl border p-5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-heading text-lg font-semibold">
                          {getChildLabel(child, index)}
                        </p>
                        {childList.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove ${getChildLabel(child, index)}`}
                            onClick={() => {
                              removeChild(child.id);
                            }}
                          >
                            <Trash2Icon />
                          </Button>
                        ) : null}
                      </div>
                      <ChildDetailsFields
                        prefix={`child-${child.id}`}
                        onNameChange={(name) => {
                          renameChild(child.id, name);
                        }}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 self-start"
                    onClick={addChild}
                  >
                    <PlusIcon />
                    Add another child
                  </Button>
                </StepPanel>
              ) : null}

              {hasStep("permissions") ? (
                <StepPanel
                  active={isActive("permissions")}
                  stepId="permissions"
                  title="Photos, travel and chat"
                  description="Choose what each child may do. You can change this at any time."
                >
                  {childList.map((child, index) => (
                    <div
                      key={child.id}
                      className="border-input flex flex-col gap-8 rounded-3xl border p-5"
                    >
                      <p className="font-heading text-lg font-semibold">
                        {getChildLabel(child, index)}
                      </p>
                      <FormSection title="Social media and photos">
                        <MediaConsentFields
                          prefix={`child-${child.id}-media`}
                          subject={child.name.trim() || "your child"}
                        />
                      </FormSection>
                      <TravelConsentFields
                        prefix={`child-${child.id}-travel`}
                        childName={child.name.trim() || "your child"}
                      />
                      <FormSection title="Team chat and messages">
                        <ChatConsentFields
                          audience="child"
                          prefix={`child-${child.id}-chat`}
                          subject={child.name.trim() || "your child"}
                        />
                      </FormSection>
                    </div>
                  ))}
                </StepPanel>
              ) : null}

              {hasStep("billing") ? (
                <StepPanel
                  active={isActive("billing")}
                  stepId="billing"
                  title="Payments"
                  description={
                    paysOwnFees
                      ? "How you will pay your subs and match fees."
                      : "Where we send invoices for match fees and subs."
                  }
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      id="billing-email"
                      name="billing-email"
                      label="Billing email"
                      type="email"
                      required
                    />
                    <SelectField
                      id="billing-method"
                      name="billing-method"
                      label="Preferred payment method"
                      options={PAYMENT_METHOD_OPTIONS}
                      value={paymentMethod}
                      onChange={(event) => {
                        setPaymentMethod(event.target.value);
                      }}
                      required
                    />
                  </div>
                  {showDirectDebitFee &&
                  paymentMethod === DIRECT_DEBIT_VALUE ? (
                    <Alert>
                      <LandmarkIcon />
                      <AlertTitle>Direct Debit has a processing fee</AlertTitle>
                      <AlertDescription>
                        Direct Debit payments are processed securely by Stripe.
                        Stripe charges a small fee on each payment, and the
                        exact amount is shown before you confirm. Choose another
                        method if you would rather avoid it.
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  <ConsentItem
                    title="Billing address is my home address"
                    checked={sameBillingAddress}
                    onCheckedChange={setSameBillingAddress}
                  />
                  {sameBillingAddress ? null : (
                    <AddressFields prefix="billing" />
                  )}
                  {role === "parent" ? (
                    <>
                      <ConsentItem
                        title="Another parent or guardian pays for some children"
                        description="They get their own invoices for the children they cover."
                        checked={secondPayer}
                        onCheckedChange={setSecondPayer}
                      />
                      {secondPayer ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <TextField
                            id="second-payer-name"
                            name="second-payer-name"
                            label="Their full name"
                          />
                          <TextField
                            id="second-payer-email"
                            name="second-payer-email"
                            label="Their email"
                            type="email"
                          />
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </StepPanel>
              ) : null}

              <StepPanel
                active={isActive("social")}
                stepId="social"
                title="Social media, photos and chat"
                description={
                  role === "parent"
                    ? "Your own accounts and whether the club may post pictures of you."
                    : "Your accounts, and whether the club may post pictures of you."
                }
              >
                <FormSection title="Your accounts">
                  <SocialLinksFields prefix="me" />
                </FormSection>
                <FormSection title="Your consent">
                  <MediaConsentFields prefix="me-media" subject="you" />
                </FormSection>
                <FormSection title="Messages and team chat">
                  <ChatConsentFields audience="adult" prefix="me-chat" />
                </FormSection>
              </StepPanel>

              <StepPanel
                active={isActive("confirm")}
                stepId="confirm"
                title="Confirm and finish"
                description="One last check before you join."
              >
                <ReviewSummary
                  formRef={formRef}
                  active={isActive("confirm")}
                  excludeStepId="confirm"
                  onEdit={handleEdit}
                />
                <div className="flex flex-col gap-3">
                  {role === "parent" ? (
                    <ConsentItem
                      name="confirm-responsibility"
                      title="I have parental responsibility"
                      description="For every child I have added."
                    />
                  ) : null}
                  <ConsentItem
                    name="confirm-accurate"
                    title="My details are correct"
                    description="I will tell the club if anything changes."
                  />
                  <ConsentItem
                    name="confirm-conduct"
                    title="I agree to the club code of conduct"
                  />
                  <ConsentItem
                    name="confirm-terms"
                    title="I accept the terms and privacy notice"
                    description="Including how my data is stored and shared with the club."
                  />
                </div>
              </StepPanel>

              <FormError message={stepError} />
              {pending ? (
                <FootballLoader label="Saving your answers" variant="inline" />
              ) : null}
              <WizardActions
                isFirst={wizard.isFirst}
                isLast={wizard.isLast}
                onBack={handleBack}
                nextDisabled={pending || (isActive("role") && role === "")}
                finishLabel="Join the club"
                onSaveForLater={handleSaveForLater}
              />
            </form>
          </>
        )}
      </div>
    </section>
  );
}
