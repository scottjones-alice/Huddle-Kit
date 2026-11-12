import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Animated, StyleSheet, useAnimatedValue, View } from "react-native";

import { FootballLoader } from "@/components/football-loader";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    backgroundColor: "#101413",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});

interface FootballSplashProps {
  children: ReactNode;
  /** Set this from real boot readiness: fonts, session restoration, or initial data. */
  ready: boolean;
}

/** Mount the app underneath the loader so it can finish preparing without a timer. */
export function FootballSplash({ children, ready }: FootballSplashProps) {
  const [dismissed, setDismissed] = useState(ready);
  const opacity = useAnimatedValue(1);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const animation = Animated.timing(opacity, {
      duration: reducedMotion ? 0 : 240,
      toValue: 0,
      useNativeDriver: true,
    });
    if (ready && !dismissed) {
      animation.start(({ finished }) => {
        if (finished) {
          setDismissed(true);
        }
      });
    }
    return () => {
      animation.stop();
    };
  }, [dismissed, opacity, ready, reducedMotion]);

  return (
    <View style={styles.container}>
      <View
        accessibilityElementsHidden={!dismissed}
        importantForAccessibility={dismissed ? "auto" : "no-hide-descendants"}
        pointerEvents={dismissed ? "auto" : "none"}
        style={styles.container}
      >
        {children}
      </View>
      {!dismissed && (
        <Animated.View style={[styles.overlay, { opacity }]}>
          <FootballLoader
            description="Your club, coming together."
            label="Getting the team ready"
            variant="splash"
          />
        </Animated.View>
      )}
    </View>
  );
}
