import { Button } from "@alice/user-interface/components/button";
import { ShieldOff } from "lucide-react";
import Link from "next/link";

import { StatusScreen } from "@/components/layout/status-screen";

export function NoAccess({ title }: { title: string }) {
  return (
    <StatusScreen
      icon={<ShieldOff />}
      title="No access"
      description={`Your account is not a member of ${title}, or your role does not include it. Ask a club admin to add you.`}
      actions={
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/">Back to your clubs</Link>
        </Button>
      }
    />
  );
}
