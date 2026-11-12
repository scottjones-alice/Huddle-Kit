import { Text } from "@react-email/components";
import type { ReactNode } from "react";

import { colors, fonts, space } from "../lib/theme";

export interface ParagraphProps {
  children: ReactNode;
  /** Renders smaller, grey text for secondary notes. */
  muted?: boolean;
}

export const Paragraph = ({ children, muted = false }: ParagraphProps) => (
  <Text
    style={{
      color: muted ? colors.muted : colors.text,
      fontFamily: fonts.sans,
      fontSize: muted ? 14 : 16,
      lineHeight: muted ? "22px" : "26px",
      margin: `0 0 ${space.md}px`,
    }}
  >
    {children}
  </Text>
);
