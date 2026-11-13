import { LinkExpired } from "@/components/auth/link-expired";
import type { LinkExpiredType } from "@/components/auth/link-expired";

const LINK_TYPES: readonly LinkExpiredType[] = ["reset", "verify", "invite"];

function parseType(value: string | string[] | undefined): LinkExpiredType {
  const match = LINK_TYPES.find((type) => type === value);
  return match ?? "reset";
}

// Reads the URL at request time, so the route is not prerendered.
export const instant = false;

export default async function LinkExpiredPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const { type } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-sm">
        <LinkExpired type={parseType(type)} />
      </div>
    </div>
  );
}
