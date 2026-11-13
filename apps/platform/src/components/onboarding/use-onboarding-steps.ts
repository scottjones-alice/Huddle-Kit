"use client";

import * as React from "react";

export interface OnboardingStep {
  id: string;
  label: string;
}

function scrollToTop() {
  window.scrollTo({ behavior: "smooth", top: 0 });
}

export function useOnboardingSteps(
  steps: readonly OnboardingStep[],
  initialStepId?: string
) {
  const [activeId, setActiveId] = React.useState(
    initialStepId ?? steps[0]?.id ?? ""
  );
  const [done, setDone] = React.useState(false);

  const index = Math.max(
    steps.findIndex((step) => step.id === activeId),
    0
  );
  const total = steps.length;
  const currentId = steps[index]?.id ?? "";

  const next = () => {
    const target = steps[index + 1];
    if (target === undefined) {
      setDone(true);
    } else {
      setActiveId(target.id);
    }
    scrollToTop();
  };

  const back = () => {
    const target = steps[index - 1];
    if (target !== undefined) {
      setActiveId(target.id);
      scrollToTop();
    }
  };

  const goTo = (id: string) => {
    if (steps.some((step) => step.id === id)) {
      setActiveId(id);
      scrollToTop();
    }
  };

  return {
    activeId: currentId,
    back,
    done,
    goTo,
    index,
    isFirst: index === 0,
    isLast: index === total - 1,
    next,
    progress: done ? 100 : ((index + 1) / total) * 100,
    total,
  };
}
