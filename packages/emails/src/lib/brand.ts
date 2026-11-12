/**
 * Brand details shown in every email (header, footer, sender-facing copy).
 * Change them here once and every template picks them up.
 */
export interface Brand {
  /** Postal address shown in the footer (required for marketing email in many regions). Leave empty to hide it. */
  address: string;
  name: string;
  supportEmail: string;
  url: string;
}

export const brand: Brand = {
  address: "",
  name: "huddlekit",
  supportEmail: "support@huddlekit.com",
  url: "https://huddlekit.com",
};
