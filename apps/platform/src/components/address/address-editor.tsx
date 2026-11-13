"use client";

import { AddressSearch } from "@/components/address/address-search";
import { TextField } from "@/components/onboarding/form-fields";
import type { AddressValues } from "@/lib/address";

const WORDS_PATTERN = "[a-z]+\\.[a-z]+\\.[a-z]+";

interface AddressEditorProps {
  values: AddressValues;
  // Called with the parts that changed. Choosing a suggestion changes all of
  // them at once.
  onChange: (changes: Partial<AddressValues>) => void;
  // Ids are `${idPrefix}-line1` and so on. Names default to the same.
  idPrefix: string;
  required?: boolean;
}

// The address split into its own lines.
export function AddressEditor({
  values,
  onChange,
  idPrefix,
  required = true,
}: AddressEditorProps) {
  return (
    <div className="space-y-4">
      <AddressSearch onPick={onChange} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id={`${idPrefix}-line1`}
          name={`${idPrefix}-line1`}
          label="Address line 1"
          autoComplete="address-line1"
          required={required}
          value={values.line1}
          onChange={(event) => {
            onChange({ line1: event.target.value });
          }}
          className="sm:col-span-2"
        />
        <TextField
          id={`${idPrefix}-line2`}
          name={`${idPrefix}-line2`}
          label="Address line 2"
          autoComplete="address-line2"
          optional
          value={values.line2}
          onChange={(event) => {
            onChange({ line2: event.target.value });
          }}
          className="sm:col-span-2"
        />
        <TextField
          id={`${idPrefix}-city`}
          name={`${idPrefix}-city`}
          label="Town or city"
          autoComplete="address-level2"
          required={required}
          value={values.city}
          onChange={(event) => {
            onChange({ city: event.target.value });
          }}
        />
        <TextField
          id={`${idPrefix}-county`}
          name={`${idPrefix}-county`}
          label="County"
          optional
          value={values.county}
          onChange={(event) => {
            onChange({ county: event.target.value });
          }}
        />
        <TextField
          id={`${idPrefix}-postcode`}
          name={`${idPrefix}-postcode`}
          label="Postcode"
          autoComplete="postal-code"
          placeholder="AB1 2CD"
          required={required}
          value={values.postcode}
          onChange={(event) => {
            onChange({ postcode: event.target.value });
          }}
        />
        <TextField
          id={`${idPrefix}-what3words`}
          name={`${idPrefix}-what3words`}
          label="what3words address"
          optional
          placeholder="filled.count.soap"
          pattern={WORDS_PATTERN}
          title="Three lower case words separated by dots"
          hint="Helps people find the exact door or pitch."
          value={values.what3words}
          onChange={(event) => {
            onChange({ what3words: event.target.value.toLowerCase() });
          }}
        />
      </div>
    </div>
  );
}
