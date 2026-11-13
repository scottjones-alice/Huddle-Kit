import { buttonVariants } from "@alice/user-interface/components/button";
import {
  FieldDescription,
  FieldGroup,
} from "@alice/user-interface/components/field";
import { cn } from "cn";
import { LockIcon } from "lucide-react";
import Link from "next/link";

export function AccountLocked({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <LockIcon className="text-muted-foreground mb-2 size-8" />
          <h1 className="text-2xl font-bold">Too many attempts</h1>
          <p className="text-muted-foreground text-sm text-balance">
            For your security, sign-in has been temporarily locked after too
            many failed attempts. Try again in a few minutes, or reset your
            password now.
          </p>
        </div>
        <Link href="/forgot-password" className={cn(buttonVariants(), "h-10")}>
          Reset password
        </Link>
        <FieldDescription className="text-center">
          <Link href="/login" className="underline underline-offset-4">
            Back to login
          </Link>
        </FieldDescription>
      </FieldGroup>
    </div>
  );
}
