import { buttonVariants } from "@alice/user-interface/components/button";
import {
  FieldDescription,
  FieldGroup,
} from "@alice/user-interface/components/field";
import { cn } from "cn";
import { LinkIcon } from "lucide-react";
import Link from "next/link";

export type LinkExpiredType = "reset" | "verify" | "invite";

const LINK_COPY: Record<
  LinkExpiredType,
  { description: string; href: string; action: string }
> = {
  invite: {
    action: "Go to login",
    description:
      "This invite link has expired or is no longer valid. Ask whoever invited you to send a new one.",
    href: "/login",
  },
  reset: {
    action: "Request a new reset link",
    description:
      "This password reset link has expired or has already been used.",
    href: "/forgot-password",
  },
  verify: {
    action: "Request a new code",
    description: "This email verification link has expired or is invalid.",
    href: "/verify-email",
  },
};

export function LinkExpired({
  type = "reset",
  className,
  ...props
}: React.ComponentProps<"div"> & { type?: LinkExpiredType }) {
  const { description, href, action } = LINK_COPY[type];

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <LinkIcon className="text-muted-foreground mb-2 size-8" />
          <h1 className="text-2xl font-bold">Link expired</h1>
          <p className="text-muted-foreground text-sm text-balance">
            {description}
          </p>
        </div>
        <Link href={href} className={cn(buttonVariants(), "h-10")}>
          {action}
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
