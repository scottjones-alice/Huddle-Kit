"use client";

import { ConsentItem } from "@/components/onboarding/consent-item";
import { SelectField, TextField } from "@/components/onboarding/form-fields";
import { FREQUENCY_OPTIONS } from "@/components/onboarding/options";

interface MoneyFieldProps {
  id: string;
  label: string;
  required?: boolean;
}

function MoneyField({ id, label, required }: MoneyFieldProps) {
  return (
    <TextField
      id={id}
      name={id}
      label={label}
      type="number"
      inputMode="decimal"
      min={0}
      step="0.01"
      placeholder="0.00"
      required={required}
      optional={required !== true}
    />
  );
}

// Amounts are entered by the club; nothing is pre-filled.
export function FeeStructureFields() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <MoneyField id="fee-subscription" label="Subscription (£)" required />
        <SelectField
          id="fee-frequency"
          name="fee-frequency"
          label="Charged"
          options={FREQUENCY_OPTIONS}
          required
        />
        <MoneyField id="fee-match" label="Match fee (£)" />
        <MoneyField id="fee-joining" label="Joining fee (£)" />
        <MoneyField id="fee-kit" label="Kit fee (£)" />
      </div>
      <div className="flex flex-col gap-4">
        <ConsentItem
          name="fee-sibling-discount"
          title="Sibling discount"
          description="Reduce the subscription for brothers and sisters."
        />
        <ConsentItem
          name="fee-late-reminders"
          title="Automatic late payment reminders"
          description="Members get a reminder when a payment is overdue."
          defaultChecked
        />
        <ConsentItem
          name="club-absorbs-dd-fee"
          title="Club pays the Direct Debit processing fee"
          description="When off, members see a notice that Direct Debit has a small processing fee."
        />
      </div>
    </div>
  );
}
