import { Heading } from "@react-email/components";
import type { ReactNode } from "react";

import { colors, fonts, space } from "../lib/theme";

export const Title = ({ children }: { children: ReactNode }) => (
  <Heading
    as="h1"
    style={{
      color: colors.primary,
      fontFamily: fonts.sans,
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: "-0.02em",
      lineHeight: "32px",
      margin: `0 0 ${space.md}px`,
    }}
  >
    {children}
  </Heading>
);
