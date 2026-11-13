import { SignupForm } from "@/components/auth/signup-form";
import { safeNextPath } from "@/lib/auth-flow";

// Reads the URL at request time, so the route is not prerendered.
export const instant = false;

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-sm">
        <SignupForm next={safeNextPath(next)} />
      </div>
    </div>
  );
}
