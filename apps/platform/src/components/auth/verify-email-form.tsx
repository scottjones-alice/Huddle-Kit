"use client";

import { Button } from "@alice/user-interface/components/button";
import {
  FieldDescription,
  FieldGroup,
} from "@alice/user-interface/components/field";
import { toast } from "@alice/user-interface/components/sonner";
import { Spinner } from "@alice/user-interface/components/spinner";
import { cn } from "cn";
import { MailIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FormError } from "@/components/auth/form-error";
import { authClient } from "@/lib/auth-client";
import {
  SIGNED_IN_PATH,
  appUrl,
  describeAuthError,
  isRateLimited,
  NETWORK_ERROR_MESSAGE,
} from "@/lib/auth-flow";

/** Seconds before the resend button works again, so people don't hit the rate limit. */
const RESEND_COOLDOWN_SECONDS = 30;
const ONE_SECOND_MS = 1000;

interface VerifyEmailFormProps extends React.ComponentProps<"div"> {
  /** The address the link was sent to, when we know it. */
  email?: string;
  /** Where the verification link lands, for example an invite page. */
  next?: string;
}

/**
 * Better Auth verifies with an emailed link, not a code. Opening the link
 * signs the person in and lands them on the home page, which sends them on to
 * onboarding. This screen tells them to check their inbox and can re-send it.
 */
export function VerifyEmailForm({
  className,
  email,
  next = SIGNED_IN_PATH,
  ...props
}: VerifyEmailFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const cooling = cooldown > 0;

  // Counts the cooldown down. Setting the same value again does not re-render.
  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown((seconds) => Math.max(seconds - 1, 0));
    }, ONE_SECOND_MS);
    return () => {
      clearInterval(timer);
    };
  }, []);

  async function handleResend() {
    if (email === undefined) {
      router.push("/login");
      return;
    }
    setError(null);
    try {
      await authClient.sendVerificationEmail(
        { callbackURL: appUrl(next), email },
        {
          onError: ({ error: sendError }) => {
            setPending(false);
            if (isRateLimited(sendError)) {
              toast.error("Too many requests", {
                description: "Wait a minute before asking for another email.",
              });
              setCooldown(RESEND_COOLDOWN_SECONDS);
              return;
            }
            const problem = describeAuthError(sendError);
            if (problem.transient) {
              toast.error(problem.message);
            }
            setError(problem.message);
          },
          onRequest: () => {
            setPending(true);
          },
          onSuccess: () => {
            setPending(false);
            toast.success("Verification email sent", {
              description: `Check ${email}, including your spam folder.`,
            });
            setCooldown(RESEND_COOLDOWN_SECONDS);
          },
        }
      );
    } catch {
      // fetch rejects when the request never gets an answer.
      setPending(false);
      toast.error(NETWORK_ERROR_MESSAGE);
      setError(NETWORK_ERROR_MESSAGE);
    }
  }

  const loginParams = new URLSearchParams();
  if (email !== undefined) {
    loginParams.set("email", email);
  }
  if (next !== SIGNED_IN_PATH) {
    loginParams.set("next", next);
  }
  const loginPath =
    loginParams.size === 0 ? "/login" : `/login?${loginParams.toString()}`;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <MailIcon className="text-muted-foreground mb-2 size-8" />
          <h1 className="text-2xl font-bold">Verify your email</h1>
          <p className="text-muted-foreground text-sm text-balance">
            {email === undefined
              ? "We've sent a verification link to your email address."
              : `We've sent a verification link to ${email}.`}{" "}
            Open it to finish creating your account.
          </p>
        </div>
        <FormError message={error} />
        <Button
          type="button"
          variant="outline"
          className="h-10"
          disabled={pending || cooling}
          onClick={() => {
            void handleResend();
          }}
        >
          {pending ? <Spinner aria-hidden /> : null}
          {pending ? "Sending…" : null}
          {!pending && cooling ? `Resend available in ${cooldown}s` : null}
          {!pending && !cooling ? "Resend verification email" : null}
        </Button>
        <FieldDescription className="text-center">
          Already have an account?{" "}
          <Link href={loginPath} className="underline underline-offset-4">
            Sign in instead
          </Link>
        </FieldDescription>
      </FieldGroup>
    </div>
  );
}
