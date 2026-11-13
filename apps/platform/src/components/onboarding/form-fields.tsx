"use client";

import { DatePicker } from "@alice/user-interface/components/date-time-picker";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@alice/user-interface/components/field";
import { Input } from "@alice/user-interface/components/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@alice/user-interface/components/native-select";
import { Textarea } from "@alice/user-interface/components/textarea";
import { isValid, parseISO } from "date-fns";
import * as React from "react";

import { isPresent } from "@/components/onboarding/is-present";
import type { Option } from "@/components/onboarding/options";

interface BaseFieldProps {
  label: string;
  hint?: string;
  optional?: boolean;
}

function LabelText({
  label,
  optional,
  required,
}: Pick<BaseFieldProps, "label" | "optional"> & { required?: boolean }) {
  return (
    <>
      {label}
      {required === true ? (
        <span aria-hidden="true" className="text-destructive">
          *
        </span>
      ) : null}
      {optional === true ? (
        <span className="text-muted-foreground font-normal">Optional</span>
      ) : null}
    </>
  );
}

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || value === "") {
    return undefined;
  }
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

// Dates use the shared calendar picker instead of the browser's own control.
// The form still receives a yyyy-MM-dd value under the same name.
function DateField({
  id,
  label,
  hint,
  optional,
  required,
  className,
  name,
  defaultValue,
  disabled,
}: React.ComponentProps<typeof Input> & BaseFieldProps) {
  const fallbackId = React.useId();
  const fieldId = id ?? fallbackId;
  const hintId = `${fieldId}-hint`;
  const [value, setValue] = React.useState(() => parseDate(defaultValue));

  return (
    <Field className={className}>
      <FieldLabel htmlFor={fieldId}>
        <LabelText label={label} optional={optional} required={required} />
      </FieldLabel>
      <DatePicker
        id={fieldId}
        name={name}
        value={value}
        onChange={setValue}
        required={required}
        disabled={disabled}
      />
      {isPresent(hint) ? (
        <FieldDescription id={hintId}>{hint}</FieldDescription>
      ) : null}
    </Field>
  );
}

function PlainTextField({
  id,
  label,
  hint,
  optional,
  required,
  className,
  ...props
}: React.ComponentProps<typeof Input> & BaseFieldProps) {
  const fallbackId = React.useId();
  const fieldId = id ?? fallbackId;
  const hintId = `${fieldId}-hint`;

  return (
    <Field className={className}>
      <FieldLabel htmlFor={fieldId}>
        <LabelText label={label} optional={optional} required={required} />
      </FieldLabel>
      <Input
        id={fieldId}
        required={required}
        aria-describedby={isPresent(hint) ? hintId : undefined}
        className="h-10 px-3"
        {...props}
      />
      {isPresent(hint) ? (
        <FieldDescription id={hintId}>{hint}</FieldDescription>
      ) : null}
    </Field>
  );
}

export function TextField(
  props: React.ComponentProps<typeof Input> & BaseFieldProps
) {
  if (props.type === "date") {
    return <DateField {...props} />;
  }
  return <PlainTextField {...props} />;
}

export function SelectField({
  id,
  label,
  hint,
  optional,
  required,
  options,
  placeholder = "Select an option",
  className,
  value,
  defaultValue = "",
  ...props
}: Omit<React.ComponentProps<typeof NativeSelect>, "size" | "className"> &
  BaseFieldProps & {
    options: readonly Option[];
    placeholder?: string;
    className?: string;
  }) {
  const fallbackId = React.useId();
  const fieldId = id ?? fallbackId;
  const hintId = `${fieldId}-hint`;

  return (
    <Field className={className}>
      <FieldLabel htmlFor={fieldId}>
        <LabelText label={label} optional={optional} required={required} />
      </FieldLabel>
      <NativeSelect
        id={fieldId}
        required={required}
        aria-describedby={isPresent(hint) ? hintId : undefined}
        className="w-full [&_select]:h-10 [&_select]:pl-3"
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        {...props}
      >
        <NativeSelectOption value="" disabled>
          {placeholder}
        </NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {isPresent(hint) ? (
        <FieldDescription id={hintId}>{hint}</FieldDescription>
      ) : null}
    </Field>
  );
}

export function TextareaField({
  id,
  label,
  hint,
  optional,
  required,
  className,
  ...props
}: React.ComponentProps<typeof Textarea> & BaseFieldProps) {
  const fallbackId = React.useId();
  const fieldId = id ?? fallbackId;
  const hintId = `${fieldId}-hint`;

  return (
    <Field className={className}>
      <FieldLabel htmlFor={fieldId}>
        <LabelText label={label} optional={optional} required={required} />
      </FieldLabel>
      <Textarea
        id={fieldId}
        required={required}
        aria-describedby={isPresent(hint) ? hintId : undefined}
        className="min-h-24 px-3 py-2"
        {...props}
      />
      {isPresent(hint) ? (
        <FieldDescription id={hintId}>{hint}</FieldDescription>
      ) : null}
    </Field>
  );
}
