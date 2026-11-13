"use client";

import { MedicalFields } from "@/components/onboarding/emergency-medical-fields";
import { SelectField } from "@/components/onboarding/form-fields";
import { KitSizeFields } from "@/components/onboarding/kit-size-fields";
import {
  AGE_GROUP_OPTIONS,
  PAYER_OPTIONS,
  POSITION_OPTIONS,
} from "@/components/onboarding/options";
import { PersonalDetailsFields } from "@/components/onboarding/personal-details-fields";
import { SocialLinksFields } from "@/components/onboarding/social-links-fields";
import { FormSection } from "@/components/onboarding/step-panel";

interface ChildDetailsFieldsProps {
  prefix: string;
  onNameChange?: (value: string) => void;
}

export function ChildDetailsFields({
  prefix,
  onNameChange,
}: ChildDetailsFieldsProps) {
  return (
    <div className="flex flex-col gap-8">
      <PersonalDetailsFields
        prefix={prefix}
        showContact={false}
        onFirstNameChange={onNameChange}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id={`${prefix}-age-group`}
          name={`${prefix}-age-group`}
          label="Age group"
          options={AGE_GROUP_OPTIONS}
          required
        />
        <SelectField
          id={`${prefix}-position`}
          name={`${prefix}-position`}
          label="Preferred position"
          optional
          options={POSITION_OPTIONS}
        />
        <SelectField
          id={`${prefix}-payer`}
          name={`${prefix}-payer`}
          label="Who pays this child's fees?"
          options={PAYER_OPTIONS}
          required
          className="sm:col-span-2"
          hint="Each child is invoiced separately, so this can differ between siblings."
        />
      </div>
      <FormSection title="Kit sizes">
        <KitSizeFields prefix={prefix} />
      </FormSection>
      <FormSection title="Medical">
        <MedicalFields prefix={prefix} subject="this child" />
      </FormSection>
      <FormSection
        title="Their social media"
        description="Only add accounts you are happy for the club to see. Optional."
      >
        <SocialLinksFields prefix={`${prefix}-social`} />
      </FormSection>
    </div>
  );
}
