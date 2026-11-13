import { AcceptInviteForm } from "@/components/auth/accept-invite-form";

// Invite links look like /accept-invite/<invitationId>. The id is the token:
// the form looks the invitation up with it once the person is signed in, and
// only the invited email address can accept.
// Reads the URL at request time, so the route is not prerendered.
export const instant = false;

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;

  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-sm">
        <AcceptInviteForm invitationId={invitationId} />
      </div>
    </div>
  );
}
