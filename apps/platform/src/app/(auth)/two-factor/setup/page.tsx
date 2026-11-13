import { TwoFactorSetupForm } from "@/components/auth/two-factor-setup-form";

export default function TwoFactorSetupPage() {
  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-sm">
        <TwoFactorSetupForm />
      </div>
    </div>
  );
}
