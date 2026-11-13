import { AccountLocked } from "@/components/auth/account-locked";

export default function AccountLockedPage() {
  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-sm">
        <AccountLocked />
      </div>
    </div>
  );
}
