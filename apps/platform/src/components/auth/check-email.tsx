import { buttonVariants } from "@alice/user-interface/components/button";
import {
  FieldDescription,
  FieldGroup,
} from "@alice/user-interface/components/field";
import { cn } from "cn";
import { MailIcon } from "lucide-react";
import Link from "next/link";

export function CheckEmail({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <MailIcon className="text-muted-foreground mb-2 size-8" />
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground text-sm text-balance">
            We&apos;ve sent you a link. It expires in 30 minutes, so open it
            soon.
          </p>
        </div>
        <Link href="/login" className={cn(buttonVariants(), "h-10")}>
          Back to login
        </Link>
        <FieldDescription className="text-center">
          Didn&apos;t get it?{" "}
          <Link
            href="/forgot-password"
            className="underline underline-offset-4"
          >
            Try again
          </Link>
        </FieldDescription>
      </FieldGroup>
    </div>
  );
}
