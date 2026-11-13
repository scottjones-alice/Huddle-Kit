import { buttonVariants } from "@alice/user-interface/components/button";
import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import Link from "next/link";

interface OnboardingCompleteProps {
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  className?: string;
}

export function OnboardingComplete({
  title,
  description,
  actionLabel,
  href,
  className,
}: OnboardingCompleteProps) {
  return (
    <div className={cn("max-w-md space-y-4 text-center", className)}>
      <div className="bg-primary text-primary-foreground mx-auto flex size-12 items-center justify-center rounded-full">
        <CheckIcon className="size-6" />
      </div>
      <div className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>
      <Link href={href} className={cn(buttonVariants(), "h-10")}>
        {actionLabel}
      </Link>
    </div>
  );
}
