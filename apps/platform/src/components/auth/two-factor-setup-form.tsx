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
import { useRouter } from "next/navigation";

const OTP_SLOTS = [0, 1, 2, 3, 4, 5] as const;

export function TwoFactorSetupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/two-factor/recovery-codes");
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Set up two-factor</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Scan the QR code with your authenticator app, then enter the code it
            shows
          </p>
        </div>
        <figure
          aria-label="QR code placeholder"
          className="text-muted-foreground mx-auto flex size-40 items-center justify-center rounded-lg border border-dashed text-center text-xs"
        >
          QR code appears here
        </figure>
        <Field>
          <FieldLabel htmlFor="otp">Verification code</FieldLabel>
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
          <FieldDescription className="text-center">
            Can&apos;t scan? Enter the setup key manually in your app.
          </FieldDescription>
        </Field>
        <Field>
          <Button type="submit" className="h-10">
            Enable two-factor
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
