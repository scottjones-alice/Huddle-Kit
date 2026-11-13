"use client";

import { Button } from "@alice/user-interface/components/button";
import * as React from "react";

interface ReviewItem {
  label: string;
  value: string;
}

interface ReviewSection {
  id: string;
  title: string;
  items: ReviewItem[];
}

interface ReviewSummaryProps {
  // The wizard's live form; answers are read straight from its fields.
  formRef: React.RefObject<HTMLFormElement | null>;
  // Only collect once the review step is showing, so values are current.
  active: boolean;
  // The review step itself, which has no answers to list.
  excludeStepId: string;
  onEdit: (stepId: string) => void;
}

const TEXT_FIELD_SELECTOR =
  'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea';
const CHOICE_SELECTOR =
  'input[type="radio"]:checked, input[type="checkbox"]:checked';
const SWITCH_SELECTOR = '[role="switch"]';
const OPTIONAL_SUFFIX = /\s*\*?\s*Optional$/u;
const REQUIRED_SUFFIX = /\s*\*$/u;

const cleanLabel = (text: string | null): string =>
  (text ?? "").replace(OPTIONAL_SUFFIX, "").replace(REQUIRED_SUFFIX, "").trim();

// Fields inside a titled FormSection read as "Section: Field", so repeated
// labels such as "Full name" stay distinguishable.
const labelFor = (section: Element, id: string): string => {
  const label = section.querySelector(`label[for="${CSS.escape(id)}"]`);
  const text = cleanLabel(label?.textContent ?? null);
  const titleId = label?.closest("fieldset")?.getAttribute("aria-labelledby");
  const title =
    titleId === null || titleId === undefined
      ? ""
      : (section.querySelector(`[id="${CSS.escape(titleId)}"]`)?.textContent ??
        "");
  return text === "" || title === "" ? text : `${title}: ${text}`;
};

const readTextField = (
  section: Element,
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
): ReviewItem | undefined => {
  let value = "";
  if (element instanceof HTMLSelectElement) {
    value =
      element.value === "" ? "" : (element.selectedOptions[0]?.text ?? "");
  } else if (element instanceof HTMLInputElement && element.type === "file") {
    value = element.files?.[0]?.name ?? "";
  } else {
    value = element.value.trim();
  }
  const label = labelFor(section, element.id);
  if (value === "" || label === "") {
    return undefined;
  }
  return { label, value };
};

const readChoiceGroups = (section: Element): ReviewItem[] => {
  const groups = new Map<string, { legend: string; values: string[] }>();
  for (const input of section.querySelectorAll<HTMLInputElement>(
    CHOICE_SELECTOR
  )) {
    const legend = input.closest("fieldset")?.querySelector("legend");
    // The first text node is the option name; the rest is its description.
    const choice = cleanLabel(
      input.closest("label")?.querySelector("span:last-child")?.firstChild
        ?.textContent ?? null
    );
    const group = groups.get(input.name) ?? {
      legend: cleanLabel(legend?.textContent ?? null),
      values: [],
    };
    group.values.push(choice);
    groups.set(input.name, group);
  }
  const items: ReviewItem[] = [];
  for (const group of groups.values()) {
    if (group.legend !== "") {
      items.push({ label: group.legend, value: group.values.join(", ") });
    }
  }
  return items;
};

const readSwitches = (section: Element): ReviewItem[] => {
  const items: ReviewItem[] = [];
  for (const toggle of section.querySelectorAll<HTMLElement>(SWITCH_SELECTOR)) {
    const isOn =
      toggle.getAttribute("aria-checked") === "true" ||
      toggle.dataset.checked !== undefined ||
      toggle.dataset.state === "checked";
    const label = labelFor(section, toggle.id);
    if (isOn && label !== "") {
      items.push({ label, value: "Yes" });
    }
  }
  return items;
};

const readSection = (section: HTMLElement): ReviewSection => {
  const items: ReviewItem[] = [];
  for (const element of section.querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >(TEXT_FIELD_SELECTOR)) {
    const item = readTextField(section, element);
    if (item !== undefined) {
      items.push(item);
    }
  }
  items.push(...readChoiceGroups(section), ...readSwitches(section));

  return {
    id: section.dataset.stepId ?? "",
    items,
    title: section.dataset.stepTitle ?? "",
  };
};

const collectSections = (
  form: HTMLFormElement | null,
  excludeStepId: string
): ReviewSection[] => {
  if (form === null) {
    return [];
  }
  const sections: ReviewSection[] = [];
  for (const element of form.querySelectorAll<HTMLElement>(
    "section[data-step-id]"
  )) {
    if (element.dataset.stepId !== excludeStepId) {
      const section = readSection(element);
      if (section.items.length > 0) {
        sections.push(section);
      }
    }
  }
  return sections;
};

export function ReviewSummary({
  formRef,
  active,
  excludeStepId,
  onEdit,
}: ReviewSummaryProps) {
  const [sections, setSections] = React.useState<ReviewSection[]>([]);

  React.useEffect(() => {
    if (active) {
      setSections(collectSections(formRef.current, excludeStepId));
    }
  }, [active, excludeStepId, formRef]);

  if (sections.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nothing to review yet. Go back and fill in the earlier steps.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => (
        <div
          key={section.id}
          className="border-input flex flex-col gap-3 rounded-2xl border p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{section.title}</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Edit ${section.title}`}
              onClick={() => {
                onEdit(section.id);
              }}
            >
              Edit
            </Button>
          </div>
          <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[minmax(0,12rem)_1fr]">
            {section.items.map((item, index) => (
              <React.Fragment key={`${item.label}-${index}`}>
                <dt className="text-muted-foreground">{item.label}</dt>
                <dd className="break-words">{item.value}</dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
