"use client";

import { Button } from "@alice/user-interface/components/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
} from "@alice/user-interface/components/field";
import { toast } from "@alice/user-interface/components/sonner";
import { Spinner } from "@alice/user-interface/components/spinner";
import { cn } from "cn";
import { FingerprintIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormError } from "@/components/auth/form-error";
import { authClient } from "@/lib/auth-client";
import {
  SIGNED_IN_PATH,
  describeAuthError,
  isRateLimited,
} from "@/lib/auth-flow";
import type { AuthErrorLike } from "@/lib/auth-flow";

export function PasskeyForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    // Set when a callback already reported the outcome, so it isn't shown twice.
    let handled = false;

    const fail = (failure: AuthErrorLike) => {
      setPending(false);
      if (isRateLimited(failure)) {
        router.push("/account-locked");
        return;
      }
      const problem = describeAuthError(failure);
      if (problem.transient) {
        toast.error(problem.message);
      }
      setError(problem.message);
    };

    // The passkey prompt is a browser feature, so cancelling it never reaches
    // the server and is returned instead of going through onError.
    const result = await authClient.signIn.passkey({
      fetchOptions: {
        onError: ({ error: failure }) => {
          handled = true;
          fail(failure);
        },
        onRequest: () => {
          setPending(true);
        },
        onSuccess: () => {
          handled = true;
          toast.success("Welcome back", { description: "Signing you in…" });
          router.push(SIGNED_IN_PATH);
        },
      },
    });

    if (!handled && result?.error) {
      fail(result.error);
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Use a passkey</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Sign in securely with your fingerprint, face or device PIN
          </p>
        </div>
        <Field>
          <FormError message={error} />
          <Button type="submit" className="h-10" disabled={pending}>
            {pending ? <Spinner /> : <FingerprintIcon />}
            {pending ? "Waiting for your passkey…" : "Continue with passkey"}
          </Button>
          <FieldDescription className="text-center">
            Prefer a password?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Back to login
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
