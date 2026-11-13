"use client";

import { Button } from "@alice/user-interface/components/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
} from "@alice/user-interface/components/field";
import { cn } from "cn";
import { useRouter } from "next/navigation";

const SAMPLE_CODES = [
  "a1b2-c3d4",
  "e5f6-g7h8",
  "i9j0-k1l2",
  "m3n4-o5p6",
  "q7r8-s9t0",
  "u1v2-w3x4",
  "y5z6-a7b8",
  "c9d0-e1f2",
] as const;

export function RecoveryCodesForm({
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
          <h1 className="text-2xl font-bold">Save your recovery codes</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Keep these somewhere safe. Each code can be used once if you lose
            access to your authenticator app.
          </p>
        </div>
        <ul className="bg-background grid grid-cols-2 gap-2 rounded-lg border p-4 font-mono text-sm">
          {SAMPLE_CODES.map((code) => (
            <li key={code} className="text-center">
              {code}
            </li>
          ))}
        </ul>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" className="h-10 flex-1">
            Copy
          </Button>
          <Button type="button" variant="outline" className="h-10 flex-1">
            Download
          </Button>
        </Field>
        <Field>
          <Button type="submit" className="h-10">
            I&apos;ve saved my codes
          </Button>
          <FieldDescription className="text-center">
            You won&apos;t be able to see these codes again.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
