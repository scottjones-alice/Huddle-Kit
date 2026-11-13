import type { ReactNode } from "react";

interface StatusScreenProps {
  actions?: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
}

/** A calm, centred message for when the app cannot show the page: signed out, no access. */
export function StatusScreen({
  actions,
  description,
  icon,
  title,
}: StatusScreenProps) {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full [&_svg]:size-6">
          {icon}
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm text-balance">
            {description}
          </p>
        </div>
        {actions === undefined ? null : (
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            {actions}
          </div>
        )}
      </div>
    </main>
  );
}
