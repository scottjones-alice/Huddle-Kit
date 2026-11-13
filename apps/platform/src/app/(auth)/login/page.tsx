import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/auth-flow";

// Reads the URL at request time, so the route is not prerendered.
export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; email?: string }>;
}) {
  const { next, email } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-sm">
        <LoginForm defaultEmail={email} next={safeNextPath(next)} />
      </div>
    </div>
  );
}
