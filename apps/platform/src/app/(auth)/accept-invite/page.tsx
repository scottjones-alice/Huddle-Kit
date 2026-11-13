import { LinkExpired } from "@/components/auth/link-expired";

// An invite link always carries its invitation id, so a bare visit is invalid.
export default function AcceptInviteIndexPage() {
  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-sm">
        <LinkExpired type="invite" />
      </div>
    </div>
  );
}
