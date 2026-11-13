"use client";

import { PASSWORD_LIMITS } from "@alice/authentication/client";
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
  describeAuthError,
  focusFirstError,
  formValue,
  isRateLimited,
  passwordProblem,
  NETWORK_ERROR_MESSAGE,
} from "@/lib/auth-flow";
import type { FieldErrors } from "@/lib/auth-flow";

interface ResetPasswordFormProps extends React.ComponentProps<"form"> {
  /** The single-use token from the emailed link. */
  token: string;
}

export function ResetPasswordForm({
  className,
  token,
  ...props
}: ResetPasswordFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = formValue(data, "password");

    const errors: FieldErrors = {};
    const passwordError = passwordProblem(password);
    if (passwordError !== null) {
      errors.password = passwordError;
    } else if (password !== formValue(data, "confirm-password")) {
      errors["confirm-password"] = "The passwords don't match.";
    }
    setFormError(null);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstError(form, errors);
      return;
    }

    try {
      await authClient.resetPassword(
        { newPassword: password, token },
        {
          onError: ({ error }) => {
            setPending(false);
            if (isRateLimited(error)) {
              router.push("/account-locked");
              return;
            }
            if (error.code === "INVALID_TOKEN") {
              router.push("/link-expired?type=reset");
              return;
            }
            const problem = describeAuthError(error);
            if (problem.field !== undefined) {
              const errorsFromServer = { [problem.field]: problem.message };
              setFieldErrors(errorsFromServer);
              focusFirstError(form, errorsFromServer);
              return;
            }
            if (problem.transient) {
              toast.error(problem.message);
            }
            setFormError(problem.message);
          },
          onRequest: () => {
            setPending(true);
          },
          onSuccess: () => {
            // All sessions are revoked on reset, so the person signs in again.
            toast.success("Password updated", {
              description: "Sign in with your new password.",
            });
            router.push("/login");
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
      // POST so a submit before the page is interactive never puts a password in the URL.
      method="post"
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
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Choose a new password for your account
          </p>
        </div>
        <FormError message={formError} />
        <FormField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          disabled={pending}
          error={fieldErrors.password}
          description={`Must be at least ${PASSWORD_LIMITS.min} characters long.`}
        />
        <FormField
          label="Confirm password"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          disabled={pending}
          error={fieldErrors["confirm-password"]}
        />
        <Field>
          <SubmitButton pending={pending} pendingLabel="Updating password…">
            Reset password
          </SubmitButton>
          <FieldDescription className="text-center">
            <Link href="/login" className="underline underline-offset-4">
              Back to login
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
