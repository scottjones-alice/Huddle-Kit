"use client";

import { Button } from "@alice/user-interface/components/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@alice/user-interface/components/field";
import { Input } from "@alice/user-interface/components/input";
import { cn } from "cn";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function TwoFactorRecoveryForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/");
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Use a recovery code</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter one of the recovery codes you saved when you set up two-factor
            authentication
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="recovery-code">Recovery code</FieldLabel>
          <Input
            id="recovery-code"
            type="text"
            autoComplete="one-time-code"
            required
            className="bg-background h-10 px-3"
          />
        </Field>
        <Field>
          <Button type="submit" className="h-10">
            Verify
          </Button>
          <FieldDescription className="text-center">
            <Link href="/two-factor" className="underline underline-offset-4">
              Back to authenticator code
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
