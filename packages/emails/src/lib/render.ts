import { render } from "@react-email/components";
import { createElement } from "react";
import type { ReactElement } from "react";

import { emailTemplates } from "./registry";
import type { EmailPropsMap, EmailTemplateName } from "./registry";

export interface RenderedMarkup {
  /** Full HTML body. */
  html: string;
  /** Plain-text alternative. Always send it alongside the HTML to improve deliverability. */
  text: string;
}

export interface RenderedEmail extends RenderedMarkup {
  /** Subject line: the override if you passed one, otherwise the template default. */
  subject: string;
}

export interface RenderEmailOptions {
  /** Replaces the template's default subject line for this send. */
  subject?: string;
}

/**
 * Renders any React element to HTML and plain text. Use it for one-off or
 * custom emails built from the shared components, without registering a template.
 *
 * @example
 * const { html, text } = await renderElement(
 *   <EmailLayout preview="Hello">
 *     <Title>Custom email</Title>
 *   </EmailLayout>
 * );
 */
export const renderElement = async (
  element: ReactElement
): Promise<RenderedMarkup> => {
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  return { html, text };
};

/**
 * Renders a registered template to the pieces any email provider needs.
 *
 * @example
 * const { html, text, subject } = await renderEmail(
 *   "welcome",
 *   { getStartedUrl: "https://huddlekit.com/dashboard", name: "Alex" },
 *   { subject: "Custom subject" } // optional
 * );
 * await resend.emails.send({ from, to, subject, html, text });
 */
export const renderEmail = async <Name extends EmailTemplateName>(
  template: Name,
  props: EmailPropsMap[Name],
  options: RenderEmailOptions = {}
): Promise<RenderedEmail> => {
  const definition = emailTemplates[template];
  const { html, text } = await renderElement(
    createElement(definition.component, props)
  );

  return { html, subject: options.subject ?? definition.subject(props), text };
};
