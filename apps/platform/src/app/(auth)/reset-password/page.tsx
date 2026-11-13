import { LinkExpired } from "@/components/auth/link-expired";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

// Better Auth sends people here as /reset-password?token=... and adds
// ?error=INVALID_TOKEN when the link is expired or already used.
// Reads the URL at request time, so the route is not prerendered.
export const instant = false;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  const isUsable =
    typeof token === "string" && token.length > 0 && error === undefined;

  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-sm">
        {isUsable ? (
          <ResetPasswordForm token={token} />
        ) : (
          <LinkExpired type="reset" />
        )}
      </div>
    </div>
  );
}
