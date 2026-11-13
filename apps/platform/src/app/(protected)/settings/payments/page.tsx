import { redirect } from "next/navigation";

// Stripe sends people back here after they connect (or leave) their account.
// Until club settings exist, "/" works out where they should go next, which
// takes them back into the club setup if it is not finished.
export default function PaymentsSettingsPage() {
  return redirect("/");
}
