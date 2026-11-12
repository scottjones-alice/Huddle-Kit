import { Hr, Link, Section, Text } from "@react-email/components";

import { brand } from "../lib/brand";
import { colors, fonts, space } from "../lib/theme";

const footerText = {
  color: colors.muted,
  fontFamily: fonts.sans,
  fontSize: 12,
  lineHeight: "18px",
  margin: 0,
} as const;

export const Footer = () => (
  <Section style={{ paddingTop: space.lg }}>
    <Hr style={{ borderColor: colors.border, margin: `0 0 ${space.md}px` }} />
    <Text style={footerText}>
      Need help? Contact us at{" "}
      <Link
        href={`mailto:${brand.supportEmail}`}
        style={{ color: colors.muted }}
      >
        {brand.supportEmail}
      </Link>
      .
    </Text>
    <Text style={{ ...footerText, paddingTop: space.xs }}>
      © {brand.name}
      {brand.address ? ` · ${brand.address}` : ""}
    </Text>
  </Section>
);
