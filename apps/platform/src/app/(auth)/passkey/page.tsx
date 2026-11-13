import { PasskeyForm } from "@/components/auth/passkey-form";

export default function PasskeyPage() {
  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-sm">
        <PasskeyForm />
      </div>
    </div>
  );
}
