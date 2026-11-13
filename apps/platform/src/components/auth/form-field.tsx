"use client";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@alice/user-interface/components/field";
import { Input } from "@alice/user-interface/components/input";
import { cn } from "cn";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useId, useState } from "react";

interface FormFieldProps extends Omit<
  React.ComponentProps<"input">,
  "id" | "name"
> {
  /** Shown red under the input. Also marks the input invalid for assistive tech. */
  error?: React.ReactNode;
  description?: React.ReactNode;
  label: string;
  name: string;
  /** Sits on the label row, for example a "Forgot your password?" link. */
  labelAction?: React.ReactNode;
}

/**
 * One labelled input with its help text and error. The input turns red and is
 * marked aria-invalid when there is an error, and the error is linked to it so
 * screen readers read the message with the field.
 */
export function FormField({
  className,
  description,
  error,
  label,
  labelAction,
  name,
  type,
  ...props
}: FormFieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;
  const hasError = error !== undefined;
  const isPassword = type === "password";

  const describedBy =
    [
      hasError ? errorId : null,
      description === undefined ? null : descriptionId,
    ]
      .filter((value) => value !== null)
      .join(" ") || undefined;

  return (
    <Field data-invalid={hasError ? true : undefined}>
      <div className="flex items-center">
        <FieldLabel htmlFor={id} className={cn(hasError && "text-destructive")}>
          {label}
        </FieldLabel>
        {labelAction}
      </div>
      <div className="relative">
        <Input
          {...props}
          id={id}
          name={name}
          type={isPassword && revealed ? "text" : type}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          className={cn(
            "bg-background h-10 px-3",
            isPassword && "pr-10",
            className
          )}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => {
              setRevealed((value) => !value);
            }}
            disabled={props.disabled}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50"
          >
            {revealed ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </button>
        ) : null}
      </div>
      {hasError ? <FieldError id={errorId}>{error}</FieldError> : null}
      {description === undefined ? null : (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
    </Field>
  );
}
