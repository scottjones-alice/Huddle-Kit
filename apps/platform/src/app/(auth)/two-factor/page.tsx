import { TwoFactorForm } from "@/components/auth/two-factor-form";

export default function TwoFactorPage() {
  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-sm">
        <TwoFactorForm />
      </div>
    </div>
  );
}
