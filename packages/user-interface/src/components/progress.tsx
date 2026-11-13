"use client";

import { cn } from "cn";
import { Progress as ProgressPrimitive } from "radix-ui";
import * as React from "react";

function Progress({
  className,
  indicatorColor,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  /** Classes for the filled part, such as `bg-green-500`. */
  indicatorColor?: string;
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-muted relative flex h-1 w-full items-center overflow-x-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "bg-primary size-full flex-1 transition-all",
          indicatorColor
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
