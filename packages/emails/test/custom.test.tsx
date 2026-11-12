import { describe, expect, it } from "vitest";

import { Button } from "../src/components/button";
import { EmailLayout } from "../src/components/email-layout";
import { Title } from "../src/components/title";
import { renderElement, renderEmail } from "../src/index";

describe("custom emails", () => {
  it("overrides the subject for a registered template", async () => {
    const { subject } = await renderEmail(
      "welcome",
      { getStartedUrl: "https://example.com", name: "Alex" },
      { subject: "Custom subject" }
    );

    expect(subject).toBe("Custom subject");
  });

  it("renders a one-off element built from shared components", async () => {
    const { html, text } = await renderElement(
      <EmailLayout preview="Hello">
        <Title>Custom email</Title>
        <Button href="https://example.com/go">Go</Button>
      </EmailLayout>
    );

    expect(html).toContain("https://example.com/go");
    expect(text).toContain("Go");
  });
});
