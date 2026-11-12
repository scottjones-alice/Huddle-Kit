import { describe, expect, it } from "vitest";

import { renderEmail, transactionalHeaders } from "../src/index";

describe(renderEmail, () => {
  it("renders the welcome email", async () => {
    const { html, subject, text } = await renderEmail("welcome", {
      getStartedUrl: "https://example.com/start",
      name: "Alex",
    });

    expect(subject).toBe("Welcome to huddlekit");
    expect(html).toContain("https://example.com/start");
    expect(text).toContain("Your account is ready");
  });

  it("renders the finish-setup reminder with the resume link and a final subject", async () => {
    const props = {
      flow: "club",
      name: "Alex",
      resumeUrl: "https://example.com/onboarding-club",
    } as const;
    const first = await renderEmail("finish-onboarding", {
      ...props,
      reminder: 1,
    });
    const last = await renderEmail("finish-onboarding", {
      ...props,
      reminder: 3,
    });

    expect(first.html).toContain(props.resumeUrl);
    expect(first.subject).toBe("Pick up where you left off with huddlekit");
    expect(last.subject).toBe("Last reminder: finish setting up your club");
  });

  it("renders the verify email with the link in html and text", async () => {
    const url = "https://example.com/verify?token=abc";
    const { html, text } = await renderEmail("verify-email", {
      expiresInMinutes: 15,
      name: "Alex",
      verificationUrl: url,
    });

    expect(html).toContain(url);
    expect(text).toContain(url);
    expect(text).toContain("15 minutes");
  });

  it("renders the forgot password email", async () => {
    const url = "https://example.com/reset?token=abc";
    const { html, subject } = await renderEmail("forgot-password", {
      name: "Alex",
      resetUrl: url,
    });

    expect(subject).toBe("Reset your password");
    expect(html).toContain(url);
  });

  it("renders the password reset confirmation", async () => {
    const { html, subject } = await renderEmail("password-reset", {
      name: "Alex",
      signInUrl: "https://example.com/sign-in",
    });

    expect(subject).toBe("Your password has been reset");
    expect(html).toContain("https://example.com/sign-in");
  });

  it("renders the accept invite email with a personalised subject", async () => {
    const { html, subject, text } = await renderEmail("accept-invite", {
      inviteUrl: "https://example.com/invite?token=abc",
      inviterName: "Sam",
      teamName: "Acme",
    });

    expect(subject).toBe("Sam invited you to join Acme");
    expect(html).toContain("https://example.com/invite?token=abc");
    expect(text).toContain("7 days");
  });
});

describe(transactionalHeaders, () => {
  it("marks mail as auto-generated and sets the entity ref id", () => {
    expect(transactionalHeaders({ entityRefId: "user_1" })).toStrictEqual({
      "Auto-Submitted": "auto-generated",
      "X-Entity-Ref-ID": "user_1",
    });
  });
});
