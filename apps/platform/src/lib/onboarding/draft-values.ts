import type { SavedDraft } from "@/lib/onboarding/save";

const prototypeFor = (
  field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
) => {
  if (field instanceof HTMLSelectElement) {
    return HTMLSelectElement.prototype;
  }
  if (field instanceof HTMLTextAreaElement) {
    return HTMLTextAreaElement.prototype;
  }
  return HTMLInputElement.prototype;
};

/**
 * Puts saved answers back into a form. Text boxes, dropdowns and date fields
 * are filled in; an input event is sent so any state tied to the field (like
 * the club web address) updates too. Tick boxes are left as they are.
 */
export const applyDraftValues = (
  form: HTMLFormElement,
  data: SavedDraft["data"]
): void => {
  for (const [name, saved] of Object.entries(data)) {
    const value = Array.isArray(saved) ? saved[0] : saved;
    const field = form.elements.namedItem(name);
    if (
      value !== undefined &&
      (field instanceof HTMLInputElement ||
        field instanceof HTMLSelectElement ||
        field instanceof HTMLTextAreaElement) &&
      field.type !== "file" &&
      field.type !== "checkbox" &&
      field.type !== "radio" &&
      field.value !== value
    ) {
      const prototype = prototypeFor(field);
      // React ignores a plain `field.value = ...`, so use the native setter.
      Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(
        field,
        value
      );
      field.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
};
