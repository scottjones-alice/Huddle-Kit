import {
  Button,
  buttonVariants,
} from "@alice/user-interface/components/button";
import { cn } from "cn";
import { BookmarkCheckIcon } from "lucide-react";
import Link from "next/link";

interface OnboardingSavedProps {
  onResume: () => void;
  exitHref?: string;
  className?: string;
}

// Shown after "Save and finish later". The emailed resume link is backend work.
export function OnboardingSaved({
  onResume,
  exitHref = "/login",
  className,
}: OnboardingSavedProps) {
  return (
    <div className={cn("max-w-md space-y-4 text-center", className)}>
      <div className="bg-primary text-primary-foreground mx-auto flex size-12 items-center justify-center rounded-full">
        <BookmarkCheckIcon className="size-6" />
      </div>
      <div className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold">
          We&apos;ve saved your place
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          We&apos;ll email you a link to pick up where you left off.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button type="button" className="h-10" onClick={onResume}>
          Keep going now
        </Button>
        <Link
          href={exitHref}
          className={cn(buttonVariants({ variant: "ghost" }), "h-10")}
        >
          Leave for now
        </Link>
      </div>
    </div>
  );
}
