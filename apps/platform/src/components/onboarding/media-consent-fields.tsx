"use client";

import { ChoiceCardGroup } from "@/components/onboarding/choice-card-group";
import { ConsentItem } from "@/components/onboarding/consent-item";
import { PLATFORM_OPTIONS } from "@/components/onboarding/options";
import { FormSection } from "@/components/onboarding/step-panel";

interface MediaConsentFieldsProps {
  prefix: string;
  // Who is pictured: "you", "your child" or a first name.
  subject: string;
}

export function MediaConsentFields({
  prefix,
  subject,
}: MediaConsentFieldsProps) {
  return (
    <div className="flex flex-col gap-6">
      <FormSection
        title="Where the club may post"
        description="Choose none to opt out of social media completely."
      >
        <ChoiceCardGroup
          name={`${prefix}-platforms`}
          legend="Social media platforms"
          type="checkbox"
          columns={2}
          options={PLATFORM_OPTIONS}
        />
      </FormSection>
      <div className="flex flex-col gap-3">
        <ConsentItem
          name={`${prefix}-photos`}
          title="Photos"
          description={`Match and training photos that include ${subject}.`}
        />
        <ConsentItem
          name={`${prefix}-videos`}
          title="Videos and match clips"
          description={`Short clips and highlights that include ${subject}.`}
        />
        <ConsentItem
          name={`${prefix}-name`}
          title="Use a full name or tag"
          description="Without this, posts only use a first name."
        />
        <ConsentItem
          name={`${prefix}-website`}
          title="Website, newsletters and programmes"
          description="Club-run channels outside social media."
        />
        <ConsentItem
          name={`${prefix}-press`}
          title="Local press and the county FA"
          description="Match reports and awards shared with third parties."
        />
      </div>
      <p className="text-muted-foreground text-xs">
        You can change or withdraw consent at any time from your account.
      </p>
    </div>
  );
}
