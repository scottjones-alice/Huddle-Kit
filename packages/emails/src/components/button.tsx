import { Button as EmailButton } from "@react-email/components";
import type { ReactNode } from "react";

import { colors, fonts, space } from "../lib/theme";

export interface ButtonProps {
  children: ReactNode;
  href: string;
}

/** Primary call-to-action. Use one per email. */
export const Button = ({ children, href }: ButtonProps) => (
  <EmailButton
    href={href}
    style={{
      backgroundColor: colors.primary,
      borderRadius: 8,
      color: colors.primaryText,
      display: "inline-block",
      fontFamily: fonts.sans,
      fontSize: 16,
      fontWeight: 600,
      margin: `${space.sm}px 0 ${space.lg}px`,
      padding: "12px 24px",
      textDecoration: "none",
    }}
  >
    {children}
  </EmailButton>
);
