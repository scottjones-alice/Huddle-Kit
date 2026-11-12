import { Section, Text } from "@react-email/components";

import { brand } from "../lib/brand";
import { colors, fonts, space } from "../lib/theme";

export const Header = () => (
  <Section style={{ paddingBottom: space.lg }}>
    <Text
      style={{
        color: colors.primary,
        fontFamily: fonts.sans,
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        margin: 0,
      }}
    >
      {brand.name}
    </Text>
  </Section>
);
