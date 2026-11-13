import { SignedOut } from "@/components/auth/signed-out";

export default function SignedOutPage() {
  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-sm">
        <SignedOut />
      </div>
    </div>
  );
}
