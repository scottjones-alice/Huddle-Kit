"use client";

import { SelectField, TextField } from "@/components/onboarding/form-fields";
import {
  ETHNICITY_OPTIONS,
  GENDER_OPTIONS,
  RELIGION_OPTIONS,
} from "@/components/onboarding/options";

interface PersonalDetailsFieldsProps {
  prefix: string;
  showContact?: boolean;
  onFirstNameChange?: (value: string) => void;
}

export function PersonalDetailsFields({
  prefix,
  showContact = true,
  onFirstNameChange,
}: PersonalDetailsFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField
        id={`${prefix}-first-name`}
        name={`${prefix}-first-name`}
        label="First name"
        required
        onChange={(event) => onFirstNameChange?.(event.target.value)}
      />
      <TextField
        id={`${prefix}-last-name`}
        name={`${prefix}-last-name`}
        label="Last name"
        required
      />
      <TextField
        id={`${prefix}-dob`}
        name={`${prefix}-dob`}
        label="Date of birth"
        type="date"
        required
      />
      <SelectField
        id={`${prefix}-gender`}
        name={`${prefix}-gender`}
        label="Gender"
        optional
        options={GENDER_OPTIONS}
      />
      {showContact ? (
        <>
          <TextField
            id={`${prefix}-phone`}
            name={`${prefix}-phone`}
            label="Mobile number"
            type="tel"
            placeholder="07123 456789"
            required
          />
          <TextField
            id={`${prefix}-email`}
            name={`${prefix}-email`}
            label="Email"
            type="email"
            placeholder="name@example.com"
            required
          />
        </>
      ) : null}
      <SelectField
        id={`${prefix}-ethnicity`}
        name={`${prefix}-ethnicity`}
        label="Ethnicity"
        optional
        options={ETHNICITY_OPTIONS}
        hint="Used only for equality monitoring."
      />
      <SelectField
        id={`${prefix}-religion`}
        name={`${prefix}-religion`}
        label="Religion or belief"
        optional
        options={RELIGION_OPTIONS}
        hint="Helps us plan around fasting and prayer times."
      />
    </div>
  );
}
