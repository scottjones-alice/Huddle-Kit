import { RecoveryCodesForm } from "@/components/auth/recovery-codes-form";

export default function RecoveryCodesPage() {
  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-sm">
        <RecoveryCodesForm />
      </div>
    </div>
  );
}
