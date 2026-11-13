import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { safeNextPath } from "@/lib/auth-flow";

// Reads the URL at request time, so the route is not prerendered.
export const instant = false;

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email, next } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-sm">
        <VerifyEmailForm email={email} next={safeNextPath(next)} />
      </div>
    </div>
  );
}
