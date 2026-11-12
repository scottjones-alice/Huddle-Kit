import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** Stay still until the device's accessibility preference is known. */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    let active = true;
    const readPreference = async () => {
      try {
        const enabled = await AccessibilityInfo.isReduceMotionEnabled();
        if (active) {
          setReducedMotion(enabled);
        }
      } catch {
        // An unavailable preference keeps the accessible static illustration.
      }
    };
    void readPreference();
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}
