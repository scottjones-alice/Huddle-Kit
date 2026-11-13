"use client";

import {
  Button,
  buttonVariants,
} from "@alice/user-interface/components/button";
import {
  FieldDescription,
  FieldGroup,
} from "@alice/user-interface/components/field";
import { toast } from "@alice/user-interface/components/sonner";
import { Spinner } from "@alice/user-interface/components/spinner";
import { cn } from "cn";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";

import { FormError } from "@/components/auth/form-error";
import { LinkExpired } from "@/components/auth/link-expired";
import { authClient } from "@/lib/auth-client";
import { SIGNED_IN_PATH, describeAuthError } from "@/lib/auth-flow";

interface AcceptInviteFormProps extends React.ComponentProps<"div"> {
  invitationId: string;
}

const invitationSchema = z.object({
  inviterEmail: z.string(),
  organizationName: z.string(),
  role: z.string(),
  status: z.string(),
});

const acceptedSchema = z.object({
  invitation: z.object({ organizationId: z.string() }),
});

type Invitation = z.infer<typeof invitationSchema>;

type LookupState =
  | { status: "loading" }
  | { status: "invalid" }
  | { status: "ready"; invitation: Invitation };

export function AcceptInviteForm({
  className,
  invitationId,
  ...props
}: AcceptInviteFormProps) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const signedIn = session !== null && session !== undefined;
  const [lookup, setLookup] = useState<LookupState>({ status: "loading" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function lookUp() {
      try {
        const { data, error: lookupError } =
          await authClient.organization.getInvitation({
            query: { id: invitationId },
          });
        const parsed = invitationSchema.safeParse(data);
        if (!cancelled) {
          setLookup(
            lookupError === null && parsed.success
              ? { invitation: parsed.data, status: "ready" }
              : { status: "invalid" }
          );
        }
      } catch {
        if (!cancelled) {
          setLookup({ status: "invalid" });
        }
      }
    }

    if (signedIn) {
      void lookUp();
    }
    return () => {
      cancelled = true;
    };
  }, [signedIn, invitationId]);

  async function handleAccept() {
    setError(null);
    await authClient.organization.acceptInvitation(
      { invitationId },
      {
        onError: ({ error: failure }) => {
          setPending(false);
          const problem = describeAuthError(failure);
          if (problem.transient) {
            toast.error(problem.message);
          }
          setError(problem.message);
        },
        onRequest: () => {
          setPending(true);
        },
        onSuccess: async ({ data }) => {
          // Make the club the active one so the app opens on it.
          const accepted = acceptedSchema.safeParse(data);
          if (accepted.success) {
            await authClient.organization.setActive({
              organizationId: accepted.data.invitation.organizationId,
            });
          }
          toast.success("You've joined the club", {
            description: "Taking you to your team…",
          });
          router.push(SIGNED_IN_PATH);
        },
      }
    );
  }

  async function handleDecline() {
    setError(null);
    await authClient.organization.rejectInvitation(
      { invitationId },
      {
        onError: ({ error: failure }) => {
          setPending(false);
          setError(describeAuthError(failure).message);
        },
        onRequest: () => {
          setPending(true);
        },
        onSuccess: () => {
          toast.success("Invite declined");
          router.push(SIGNED_IN_PATH);
        },
      }
    );
  }

  if (sessionPending) {
    return <Spinner className="mx-auto size-6" />;
  }

  if (!signedIn) {
    const next = encodeURIComponent(`/accept-invite/${invitationId}`);
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">You&apos;ve been invited</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Sign in or create an account with the email address the invite was
              sent to.
            </p>
          </div>
          <Link
            href={`/login?next=${next}`}
            className={cn(buttonVariants(), "h-10")}
          >
            Login
          </Link>
          <Link
            href={`/signup?next=${next}`}
            className={cn(buttonVariants({ variant: "outline" }), "h-10")}
          >
            Create account
          </Link>
        </FieldGroup>
      </div>
    );
  }

  if (lookup.status === "loading") {
    return <Spinner className="mx-auto size-6" />;
  }

  if (lookup.status === "invalid" || lookup.invitation.status !== "pending") {
    return <LinkExpired type="invite" />;
  }

  const { invitation } = lookup;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Accept your invite</h1>
          <p className="text-muted-foreground text-sm text-balance">
            {`${invitation.inviterEmail} invited you to join ${invitation.organizationName} as ${invitation.role}.`}
          </p>
        </div>
        <FormError message={error} />
        <Button
          type="button"
          className="h-10"
          disabled={pending}
          onClick={() => {
            void handleAccept();
          }}
        >
          {pending ? <Spinner /> : null}
          {pending ? "Joining…" : "Accept invite"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10"
          disabled={pending}
          onClick={() => {
            void handleDecline();
          }}
        >
          Decline
        </Button>
        <FieldDescription className="text-center">
          Signed in as {session.user.email}. Wrong account?{" "}
          <Link href="/login" className="underline underline-offset-4">
            Switch
          </Link>
        </FieldDescription>
      </FieldGroup>
    </div>
  );
}
