import { Hr } from "@react-email/components";

import { colors, space } from "../lib/theme";

export const Divider = () => (
  <Hr style={{ borderColor: colors.border, margin: `${space.lg}px 0` }} />
);
