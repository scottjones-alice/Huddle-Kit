import type { ReactNode } from "react";

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="dark bg-background text-foreground flex min-h-svh flex-col">
      {children}
    </main>
  );
}
