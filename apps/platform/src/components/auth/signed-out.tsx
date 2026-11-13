import { buttonVariants } from "@alice/user-interface/components/button";
import {
  FieldDescription,
  FieldGroup,
} from "@alice/user-interface/components/field";
import { cn } from "cn";
import { LogOutIcon } from "lucide-react";
import Link from "next/link";

export function SignedOut({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <LogOutIcon className="text-muted-foreground mb-2 size-8" />
          <h1 className="text-2xl font-bold">You&apos;ve been signed out</h1>
          <p className="text-muted-foreground text-sm text-balance">
            You have been signed out of your account. See you soon.
          </p>
        </div>
        <Link href="/login" className={cn(buttonVariants(), "h-10")}>
          Sign back in
        </Link>
        <FieldDescription className="text-center">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="underline underline-offset-4">
            Sign up
          </Link>
        </FieldDescription>
      </FieldGroup>
    </div>
  );
}
