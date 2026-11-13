import { TwoFactorRecoveryForm } from "@/components/auth/two-factor-recovery-form";

export default function TwoFactorRecoveryPage() {
  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-sm">
        <TwoFactorRecoveryForm />
      </div>
    </div>
  );
}
