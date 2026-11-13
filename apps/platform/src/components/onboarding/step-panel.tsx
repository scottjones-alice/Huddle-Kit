import { cn } from "cn";
import * as React from "react";

import { isPresent } from "@/components/onboarding/is-present";

interface StepPanelProps {
  active: boolean;
  stepId: string;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

// Inactive panels stay mounted (just hidden) so typed values survive Back/Next.
export function StepPanel({
  active,
  stepId,
  title,
  description,
  children,
  className,
}: StepPanelProps) {
  return (
    <section
      hidden={!active}
      data-step-id={stepId}
      data-step-title={title}
      className={cn("flex flex-col gap-6", className)}
    >
      <div className="space-y-1.5">
        <h2 className="font-heading text-xl font-semibold lg:text-2xl">
          {title}
        </h2>
        <p className="text-muted-foreground text-sm text-pretty">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  const titleId = React.useId();

  return (
    <fieldset
      aria-labelledby={titleId}
      className={cn("flex min-w-0 flex-col gap-4 border-0 p-0", className)}
    >
      <div className="space-y-1">
        <p id={titleId} className="text-sm font-semibold">
          {title}
        </p>
        {isPresent(description) ? (
          <p className="text-muted-foreground text-sm text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </fieldset>
  );
}
