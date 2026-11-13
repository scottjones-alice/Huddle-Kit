"use client";

import { Button } from "@alice/user-interface/components/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@alice/user-interface/components/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@alice/user-interface/components/input-otp";
import { cn } from "cn";
import Link from "next/link";
import { useRouter } from "next/navigation";

const OTP_SLOTS = [0, 1, 2, 3, 4, 5] as const;

export function TwoFactorForm({
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
          <h1 className="text-2xl font-bold">Two-factor authentication</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="otp" className="sr-only">
            Authentication code
          </FieldLabel>
          <InputOTP
            id="otp"
            maxLength={6}
            required
            containerClassName="justify-center"
          >
            <InputOTPGroup>
              {OTP_SLOTS.map((slot) => (
                <InputOTPSlot key={slot} index={slot} className="size-10" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </Field>
        <Field>
          <Button type="submit" className="h-10">
            Verify
          </Button>
          <FieldDescription className="text-center">
            Lost your device?{" "}
            <Link
              href="/two-factor/recovery"
              className="underline underline-offset-4"
            >
              Use a recovery code
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
