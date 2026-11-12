import { Link, Text } from "@react-email/components";

import { colors, fonts, space } from "../lib/theme";

/**
 * "Button not working?" block. Some clients strip or break buttons, and it
 * lets people copy the URL into another browser.
 */
export const LinkFallback = ({ href }: { href: string }) => (
  <Text
    style={{
      color: colors.muted,
      fontFamily: fonts.sans,
      fontSize: 13,
      lineHeight: "20px",
      margin: `0 0 ${space.md}px`,
      wordBreak: "break-all",
    }}
  >
    If the button doesn&apos;t work, copy and paste this link into your browser:{" "}
    <Link href={href} style={{ color: colors.muted }}>
      {href}
    </Link>
  </Text>
);
