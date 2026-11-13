"use client";

import { buttonVariants } from "@alice/user-interface/components/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
} from "@alice/user-interface/components/field";
import { toast } from "@alice/user-interface/components/sonner";
import { cn } from "cn";
import { FingerprintIcon } from "lucide-react";
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
  verifyEmailPath,
  NETWORK_ERROR_MESSAGE,
} from "@/lib/auth-flow";
import type { FieldErrors } from "@/lib/auth-flow";

const UNVERIFIED_STATUS = 403;

interface LoginFormProps extends React.ComponentProps<"form"> {
  /** Where to go after signing in. Must already be checked with safeNextPath. */
  next?: string;
  /** Pre-fills the email, for example when sent here from sign-up. */
  defaultEmail?: string;
}

export function LoginForm({
  className,
  next = SIGNED_IN_PATH,
  defaultEmail,
  ...props
}: LoginFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = formValue(data, "email").trim();
    const password = formValue(data, "password");

    const errors: FieldErrors = {};
    const emailError = emailProblem(email);
    if (emailError !== null) {
      errors.email = emailError;
    }
    if (password.length === 0) {
      errors.password = "Enter your password.";
    }
    setFormError(null);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstError(form, errors);
      return;
    }

    try {
      await authClient.signIn.email(
        { callbackURL: appUrl(next), email, password },
        {
          onError: ({ error }) => {
            setPending(false);
            if (isRateLimited(error)) {
              router.push("/account-locked");
              return;
            }
            if (error.status === UNVERIFIED_STATUS) {
              // The server re-sends the verification email on sign-in.
              toast.info("Verify your email to continue", {
                description: "We've sent you a fresh link.",
              });
              router.push(verifyEmailPath(email, next));
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
            toast.success("Welcome back", { description: "Signing you in…" });
            router.push(next);
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
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>
        <FormError message={formError} />
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email webauthn"
          placeholder="m@example.com"
          defaultValue={defaultEmail}
          disabled={pending}
          error={fieldErrors.email}
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          // With the email already filled in, the password is the next thing to type.
          autoFocus={defaultEmail !== undefined && defaultEmail.length > 0}
          disabled={pending}
          error={fieldErrors.password}
          labelAction={
            <Link
              href="/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
          }
        />
        <Field>
          <SubmitButton pending={pending} pendingLabel="Signing in…">
            Login
          </SubmitButton>
          <Link
            href="/passkey"
            aria-disabled={pending}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10",
              pending && "pointer-events-none opacity-50"
            )}
          >
            <FingerprintIcon />
            Sign in with passkey
          </Link>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <Link
              href={
                next === SIGNED_IN_PATH
                  ? "/signup"
                  : `/signup?next=${encodeURIComponent(next)}`
              }
              className="underline underline-offset-4"
            >
              Sign up
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
