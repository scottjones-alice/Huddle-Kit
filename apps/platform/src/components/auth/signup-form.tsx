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
  SIGNED_IN_PATH,
  appUrl,
  describeAuthError,
  emailProblem,
  focusFirstError,
  formValue,
  isRateLimited,
  passwordProblem,
  verifyEmailPath,
  NETWORK_ERROR_MESSAGE,
} from "@/lib/auth-flow";
import type { FieldErrors } from "@/lib/auth-flow";

interface SignupFormProps extends React.ComponentProps<"form"> {
  /** Where the verification link lands. Must already be checked with safeNextPath. */
  next?: string;
}

export function SignupForm({
  className,
  next = SIGNED_IN_PATH,
  ...props
}: SignupFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // The address that already has an account, so the error can link to sign-in with it.
  const [existingEmail, setExistingEmail] = useState<string | null>(null);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = formValue(data, "name").trim();
    const email = formValue(data, "email").trim();
    const password = formValue(data, "password");

    // Checked in the order the fields appear, so focus lands on the first problem.
    const errors: FieldErrors = {};
    if (name.length === 0) {
      errors.name = "Enter your name.";
    }
    const emailError = emailProblem(email);
    if (emailError !== null) {
      errors.email = emailError;
    }
    const passwordError = passwordProblem(password);
    if (passwordError !== null) {
      errors.password = passwordError;
    } else if (password !== formValue(data, "confirm-password")) {
      errors["confirm-password"] = "The passwords don't match.";
    }
    setFormError(null);
    setExistingEmail(null);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstError(form, errors);
      return;
    }

    try {
      await authClient.signUp.email(
        { callbackURL: appUrl(next), email, name, password },
        {
          onError: ({ error }) => {
            setPending(false);
            if (isRateLimited(error)) {
              router.push("/account-locked");
              return;
            }
            if (error.code === "USER_ALREADY_EXISTS") {
              // Stay here so a mistyped address can be fixed. Keep the name and
              // email, clear the passwords, and put the cursor on the email.
              setExistingEmail(email);
              for (const input of form.querySelectorAll<HTMLInputElement>(
                'input[type="password"]'
              )) {
                input.value = "";
              }
              focusFirstError(form, { email: "exists" });
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
            toast.success("Account created", {
              description: `We've sent a verification link to ${email}.`,
            });
            router.push(verifyEmailPath(email, next));
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

  const loginParams = new URLSearchParams();
  if (existingEmail !== null) {
    loginParams.set("email", existingEmail);
  }
  if (next !== SIGNED_IN_PATH) {
    loginParams.set("next", next);
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
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Fill in the form below to create your account
          </p>
        </div>
        <FormError message={formError} />
        <FormField
          label="Full Name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="John Doe"
          disabled={pending}
          error={fieldErrors.name}
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="m@example.com"
          disabled={pending}
          onChange={() => {
            setExistingEmail(null);
          }}
          error={
            existingEmail === null ? (
              fieldErrors.email
            ) : (
              <>
                An account with this email already exists.{" "}
                <Link
                  href={`/login?${loginParams.toString()}`}
                  className="underline underline-offset-4"
                >
                  Sign in
                </Link>{" "}
                or{" "}
                <Link
                  href="/forgot-password"
                  className="underline underline-offset-4"
                >
                  reset your password
                </Link>
                .
              </>
            )
          }
          description="We'll use this to contact you. We will not share your email with anyone else. It can't be changed later."
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          disabled={pending}
          error={fieldErrors.password}
          description={`Must be at least ${PASSWORD_LIMITS.min} characters long.`}
        />
        <FormField
          label="Confirm Password"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          disabled={pending}
          error={fieldErrors["confirm-password"]}
        />
        <Field>
          <SubmitButton pending={pending} pendingLabel="Creating account…">
            Create Account
          </SubmitButton>
          <FieldDescription className="px-6 text-center">
            Already have an account?{" "}
            <Link
              href={
                next === SIGNED_IN_PATH
                  ? "/login"
                  : `/login?next=${encodeURIComponent(next)}`
              }
            >
              Sign in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
