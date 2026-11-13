"use client";

import { cn } from "cn";
import { CheckIcon } from "lucide-react";

import { isPresent } from "@/components/onboarding/is-present";
import type { Option } from "@/components/onboarding/options";

const COLUMN_CLASS = {
  1: "",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
} as const;

interface ChoiceCardGroupProps {
  name: string;
  legend: string;
  options: readonly Option[];
  type?: "radio" | "checkbox";
  columns?: keyof typeof COLUMN_CLASS;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

// Pill-style radio / checkbox cards, matching the questionnaire choices.
export function ChoiceCardGroup({
  name,
  legend,
  options,
  type = "radio",
  columns = 1,
  value,
  defaultValue,
  onValueChange,
  className,
}: ChoiceCardGroupProps) {
  const isControlled = value !== undefined;

  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="sr-only">{legend}</legend>
      <div className={cn("grid gap-3", COLUMN_CLASS[columns], className)}>
        {options.map((option) => (
          <label
            key={option.value}
            className="group/choice border-input hover:bg-input/40 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/10 has-[:focus-visible]:border-ring has-[:focus-visible]:ring-ring/50 relative flex min-h-11 cursor-pointer items-start gap-2.5 rounded-3xl border px-4 py-3 text-start text-sm transition-colors select-none has-[:focus-visible]:ring-3"
          >
            <input
              className="sr-only"
              type={type}
              name={name}
              value={option.value}
              onChange={() => onValueChange?.(option.value)}
              {...(isControlled
                ? { checked: value === option.value }
                : { defaultChecked: defaultValue === option.value })}
            />
            <span
              aria-hidden="true"
              className={cn(
                "bg-input/90 text-primary-foreground group-has-[:checked]/choice:border-primary group-has-[:checked]/choice:bg-primary pointer-events-none mt-0.5 flex size-4 shrink-0 items-center justify-center border border-transparent",
                type === "radio" ? "rounded-full" : "rounded-sm"
              )}
            >
              <CheckIcon className="size-3.5 opacity-0 group-has-[:checked]/choice:opacity-100" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1 leading-snug">
              {option.label}
              {isPresent(option.description) ? (
                <span className="text-muted-foreground">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
