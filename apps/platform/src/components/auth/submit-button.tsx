import { Button } from "@alice/user-interface/components/button";
import { Spinner } from "@alice/user-interface/components/spinner";

interface SubmitButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  "type"
> {
  pending: boolean;
  /** Shown while the request is running, for example "Signing in…". */
  pendingLabel: string;
}

/** A submit button that disables itself and says what it is doing while loading. */
export function SubmitButton({
  children,
  pending,
  pendingLabel,
  ...props
}: SubmitButtonProps) {
  return (
    <Button type="submit" className="h-10" disabled={pending} {...props}>
      {pending ? <Spinner aria-hidden /> : null}
      {pending ? pendingLabel : children}
    </Button>
  );
}
