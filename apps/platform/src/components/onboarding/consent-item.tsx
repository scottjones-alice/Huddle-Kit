"use client";

import { Label } from "@alice/user-interface/components/label";
import { Switch } from "@alice/user-interface/components/switch";
import { cn } from "cn";
import * as React from "react";

import { isPresent } from "@/components/onboarding/is-present";

interface ConsentItemProps {
  title: string;
  description?: string;
  name?: string;
  id?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

export function ConsentItem({
  title,
  description,
  name,
  id,
  defaultChecked,
  checked,
  onCheckedChange,
  className,
}: ConsentItemProps) {
  const fallbackId = React.useId();
  const switchId = id ?? fallbackId;
  const descriptionId = `${switchId}-description`;

  return (
    <div
      className={cn(
        "border-input flex items-start justify-between gap-4 rounded-2xl border p-4",
        className
      )}
    >
      <div className="space-y-1">
        <Label htmlFor={switchId}>{title}</Label>
        {isPresent(description) ? (
          <p
            id={descriptionId}
            className="text-muted-foreground text-sm text-pretty"
          >
            {description}
          </p>
        ) : null}
      </div>
      <Switch
        id={switchId}
        name={name}
        aria-describedby={isPresent(description) ? descriptionId : undefined}
        defaultChecked={defaultChecked}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-0.5"
      />
    </div>
  );
}
