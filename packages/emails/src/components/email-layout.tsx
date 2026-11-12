import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
} from "@react-email/components";
import type { ReactNode } from "react";

import { CONTAINER_WIDTH, colors, fonts, space } from "../lib/theme";
import { Footer } from "./footer";
import { Header } from "./header";

export interface EmailLayoutProps {
  children: ReactNode;
  /** Inbox preview text shown next to the subject line. Keep under ~90 chars. */
  preview: string;
}

/** Shared frame for every template: header, white card, footer. */
export const EmailLayout = ({ children, preview }: EmailLayoutProps) => (
  <Html lang="en">
    <Head />
    <Preview>{preview}</Preview>
    <Body
      style={{
        backgroundColor: colors.background,
        fontFamily: fonts.sans,
        margin: 0,
        padding: `${space.xl}px ${space.md}px`,
      }}
    >
      <Container style={{ maxWidth: CONTAINER_WIDTH, width: "100%" }}>
        <Header />
        <Section
          style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: space.xl,
          }}
        >
          {children}
        </Section>
        <Footer />
      </Container>
    </Body>
  </Html>
);
