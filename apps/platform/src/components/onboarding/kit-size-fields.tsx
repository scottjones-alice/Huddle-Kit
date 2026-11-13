"use client";

import { SelectField, TextField } from "@/components/onboarding/form-fields";
import { KIT_SIZE_OPTIONS } from "@/components/onboarding/options";

interface KitSizeFieldsProps {
  prefix: string;
}

export function KitSizeFields({ prefix }: KitSizeFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField
        id={`${prefix}-shirt-size`}
        name={`${prefix}-shirt-size`}
        label="Shirt size"
        options={KIT_SIZE_OPTIONS}
        optional
      />
      <SelectField
        id={`${prefix}-shorts-size`}
        name={`${prefix}-shorts-size`}
        label="Shorts size"
        options={KIT_SIZE_OPTIONS}
        optional
      />
      <TextField
        id={`${prefix}-squad-number`}
        name={`${prefix}-squad-number`}
        label="Preferred squad number"
        inputMode="numeric"
        maxLength={2}
        optional
      />
      <TextField
        id={`${prefix}-shirt-name`}
        name={`${prefix}-shirt-name`}
        label="Name on shirt"
        maxLength={16}
        optional
      />
    </div>
  );
}
