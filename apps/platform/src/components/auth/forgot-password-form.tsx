"use client";

import {
  Field,
  FieldDescription,
  FieldGroup,
} from "@alice/user-interface/components/field";
import { toast } from "@alice/user-interface/components/sonner";
import { cn } from "cn";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormError } from "@/components/auth/form-error";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { authClient } from "@/lib/auth-client";
import {
  appUrl,
  describeAuthError,
  emailProblem,
  focusFirstError,
  formValue,
  isRateLimited,
  NETWORK_ERROR_MESSAGE,
} from "@/lib/auth-flow";
import type { FieldErrors } from "@/lib/auth-flow";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = formValue(new FormData(form), "email").trim();

    const errors: FieldErrors = {};
    const emailError = emailProblem(email);
    if (emailError !== null) {
      errors.email = emailError;
    }
    setFormError(null);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstError(form, errors);
      return;
    }

    try {
      await authClient.requestPasswordReset(
        { email, redirectTo: appUrl("/reset-password") },
        {
          onError: ({ error }) => {
            setPending(false);
            if (isRateLimited(error)) {
              router.push("/account-locked");
              return;
            }
            const problem = describeAuthError(error);
            if (problem.transient) {
              toast.error(problem.message);
            }
            setFormError(problem.message);
          },
          onRequest: () => {
            setPending(true);
          },
          onSuccess: () => {
            // Same message whether or not the address has an account, so it can't be probed.
            toast.success("Check your inbox", {
              description:
                "If an account exists for that email, a reset link is on its way.",
            });
            router.push("/check-email");
          },
        }
      );
    } catch {
      // fetch rejects when the request never gets an answer.
      setPending(false);
      toast.error(NETWORK_ERROR_MESSAGE);
      setFormError(NETWORK_ERROR_MESSAGE);
    }
  }

  return (
    <form
      noValidate
      aria-busy={pending}
      className={cn("flex flex-col gap-6", className)}
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Forgot your password?</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email and we&apos;ll send you a link to reset it
          </p>
        </div>
        <FormError message={formError} />
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="m@example.com"
          disabled={pending}
          error={fieldErrors.email}
        />
        <Field>
          <SubmitButton pending={pending} pendingLabel="Sending link…">
            Send reset link
          </SubmitButton>
          <FieldDescription className="text-center">
            Remembered it?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Back to login
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
