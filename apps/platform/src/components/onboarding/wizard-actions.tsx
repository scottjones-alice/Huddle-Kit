import { Button } from "@alice/user-interface/components/button";

interface WizardActionsProps {
  isFirst: boolean;
  isLast: boolean;
  onBack: () => void;
  // When set, shows a "Save and finish later" button.
  onSaveForLater?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  finishLabel?: string;
}

export function WizardActions({
  isFirst,
  isLast,
  onBack,
  onSaveForLater,
  nextDisabled,
  nextLabel = "Continue",
  finishLabel = "Finish",
}: WizardActionsProps) {
  return (
    <div className="flex flex-col gap-4 border-t pt-6">
      <div className="flex items-center justify-between gap-2">
        {isFirst ? (
          <span />
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={onBack}
          >
            Back
          </Button>
        )}
        <Button type="submit" className="h-10 min-w-28" disabled={nextDisabled}>
          {isLast ? finishLabel : nextLabel}
        </Button>
      </div>
      {onSaveForLater === undefined ? null : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-center"
          onClick={onSaveForLater}
        >
          Save and finish later
        </Button>
      )}
    </div>
  );
}
