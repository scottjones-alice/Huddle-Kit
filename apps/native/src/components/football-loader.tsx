import { useEffect, useState } from "react";
import {
  Animated,
  AppState,
  Easing,
  StyleSheet,
  Text,
  useAnimatedValue,
  useWindowDimensions,
  View,
} from "react-native";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

const NIGHT = "#101413";
const LIME = "#d4ff00";
const CORAL = "#f38773";
const SCENE_WIDTH = 320;
const SCENE_HEIGHT = 220;
const MATCH_DURATION = 8400;
const MATCH_TIMES = [0, 0.2, 0.4, 0.6, 0.68, 0.8, 0.9, 1];
const STRIPES = [0, 1, 2, 3, 4, 5, 6, 7];
const PLAYERS = [
  {
    id: "home-keeper",
    team: "home",
    x: [39, 40, 42, 42, 42, 42, 39, 39],
    y: [106, 104, 110, 106, 106, 106, 106, 106],
  },
  {
    id: "home-wing",
    team: "home",
    x: [112, 145, 157, 182, 186, 184, 112, 112],
    y: [68, 68, 70, 79, 80, 76, 68, 68],
  },
  {
    id: "home-playmaker",
    team: "home",
    x: [115, 133, 156, 175, 175, 179, 115, 115],
    y: [121, 119, 113, 111, 111, 108, 121, 121],
  },
  {
    id: "home-striker",
    team: "home",
    x: [180, 197, 214, 234, 243, 245, 180, 180],
    y: [140, 132, 117, 105, 105, 101, 140, 140],
  },
  {
    id: "away-keeper",
    team: "away",
    x: [277, 277, 278, 278, 282, 282, 277, 277],
    y: [106, 108, 110, 119, 123, 123, 106, 106],
  },
  {
    id: "away-defender",
    team: "away",
    x: [230, 233, 241, 251, 251, 253, 230, 230],
    y: [77, 80, 86, 89, 89, 89, 77, 77],
  },
  {
    id: "away-midfielder",
    team: "away",
    x: [180, 174, 189, 209, 209, 209, 180, 180],
    y: [93, 89, 91, 95, 95, 95, 93, 93],
  },
  {
    id: "away-wing",
    team: "away",
    x: [216, 220, 231, 245, 245, 245, 216, 216],
    y: [152, 145, 136, 129, 129, 129, 152, 152],
  },
] as const;

const styles = StyleSheet.create({
  arms: {
    borderRadius: 3,
    height: 6,
    left: -2,
    position: "absolute",
    top: 9,
    width: 20,
  },
  ball: {
    backgroundColor: "#fffdf0",
    borderColor: "#10271c",
    borderRadius: 5,
    borderWidth: 1,
    height: 9,
    left: -4,
    position: "absolute",
    top: -4,
    width: 9,
  },
  ballPatch: {
    backgroundColor: "#172a23",
    borderRadius: 1,
    height: 3,
    left: 2,
    position: "absolute",
    top: 2,
    width: 3,
  },
  bootLeft: {
    backgroundColor: "#f4f2df",
    borderRadius: 1,
    height: 5,
    left: 3,
    position: "absolute",
    top: 20,
    width: 4,
  },
  bootRight: {
    backgroundColor: "#f4f2df",
    borderRadius: 1,
    height: 5,
    left: 9,
    position: "absolute",
    top: 20,
    width: 4,
  },
  centreCircle: {
    borderColor: "#a2c8a6",
    borderRadius: 27,
    borderWidth: 1,
    height: 54,
    left: 116,
    position: "absolute",
    top: 62,
    width: 54,
  },
  centreSpot: {
    backgroundColor: "#d6e6cc",
    borderRadius: 2,
    height: 4,
    left: 141,
    position: "absolute",
    top: 87,
    width: 4,
  },
  compact: {
    borderColor: "#2e3833",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
    width: "100%",
  },
  compactCopy: { alignItems: "flex-start", flex: 1, gap: 6, minWidth: 0 },
  compactLabel: { fontSize: 14, textAlign: "left" },
  container: {
    alignItems: "center",
    backgroundColor: NIGHT,
    justifyContent: "center",
    padding: 24,
  },
  copy: { alignItems: "center", gap: 9, maxWidth: 320, width: "100%" },
  description: {
    color: "#a3b1a6",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  errorText: { color: CORAL },
  goal: {
    backgroundColor: "#a2c8a622",
    borderColor: "#e7eada",
    borderRadius: 3,
    borderWidth: 2,
    height: 45,
    position: "absolute",
    top: 83,
    width: 16,
  },
  goalArea: {
    borderColor: "#a2c8a6",
    borderWidth: 1,
    height: 48,
    position: "absolute",
    top: 64,
    width: 14,
  },
  goalBadge: {
    alignSelf: "center",
    backgroundColor: LIME,
    borderRadius: 20,
    left: 119,
    paddingHorizontal: 15,
    paddingVertical: 6,
    position: "absolute",
    top: 0,
  },
  goalLeft: { left: 13 },
  goalRight: { right: 13 },
  goalText: {
    color: NIGHT,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  hair: {
    backgroundColor: "#342b24",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    height: 4,
    left: 4,
    position: "absolute",
    top: 0,
    width: 9,
  },
  halfwayLine: {
    backgroundColor: "#a2c8a6",
    bottom: 11,
    left: 143,
    position: "absolute",
    top: 11,
    width: 1,
  },
  head: {
    backgroundColor: "#dfaf83",
    borderRadius: 5,
    height: 9,
    left: 4,
    position: "absolute",
    top: 1,
    width: 9,
  },
  jersey: {
    borderRadius: 4,
    height: 12,
    left: 2,
    position: "absolute",
    top: 7,
    width: 12,
  },
  label: {
    color: "#f1f4e9",
    fontSize: 21,
    fontWeight: "600",
    textAlign: "center",
  },
  leftBox: { left: 12 },
  penaltyBox: {
    borderColor: "#a2c8a6",
    borderWidth: 1,
    height: 94,
    position: "absolute",
    top: 41,
    width: 39,
  },
  pitch: {
    backgroundColor: "#26714d",
    borderColor: "#438f61",
    borderRadius: 18,
    borderWidth: 1,
    height: 178,
    left: 16,
    overflow: "hidden",
    position: "absolute",
    top: 17,
    width: 288,
  },
  pitchBase: {
    backgroundColor: "#143d2d",
    borderRadius: 18,
    height: 178,
    left: 16,
    position: "absolute",
    top: 27,
    width: 288,
  },
  player: { height: 24, left: -7, position: "absolute", top: -13, width: 16 },
  playerShadow: {
    backgroundColor: "#07221966",
    borderRadius: 10,
    height: 7,
    left: 2,
    position: "absolute",
    top: 20,
    width: 18,
  },
  progressFill: { backgroundColor: LIME, borderRadius: 4, height: "100%" },
  progressRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    width: "100%",
  },
  progressText: {
    color: "#d9e3d7",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  progressTrack: {
    backgroundColor: "#2e3833",
    borderRadius: 4,
    flex: 1,
    height: 4,
    overflow: "hidden",
  },
  rightBox: { right: 12 },
  scene: { height: SCENE_HEIGHT, position: "absolute", width: SCENE_WIDTH },
  shorts: {
    backgroundColor: "#172a23",
    height: 4,
    left: 3,
    position: "absolute",
    top: 17,
    width: 10,
  },
  splash: { flex: 1, width: "100%" },
  stripe: {
    backgroundColor: "#ffffff",
    bottom: 0,
    position: "absolute",
    top: 0,
    width: 36,
  },
  tagline: {
    color: "#a3b1a6",
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 64,
    textAlign: "center",
  },
  touchline: {
    borderColor: "#a2c8a6",
    borderRadius: 3,
    borderWidth: 1,
    bottom: 11,
    left: 12,
    position: "absolute",
    right: 12,
    top: 11,
  },
  wordmark: {
    color: "#f1f4e9",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -1.5,
    marginBottom: 56,
  },
  wordmarkDot: { color: LIME },
});

export interface FootballLoaderProps {
  description?: string;
  label?: string;
  paused?: boolean;
  /** Actual operation progress from 0 to 100; omit for an indeterminate wait. */
  progress?: number;
  state?: "loading" | "success" | "error";
  variant?: "page" | "splash" | "inline";
}

function FootballPlayer({
  clock,
  player,
}: {
  clock: Animated.Value;
  player: (typeof PLAYERS)[number];
}) {
  const kitColor = player.team === "home" ? LIME : CORAL;

  return (
    <Animated.View
      style={[
        styles.player,
        {
          transform: [
            {
              translateX: clock.interpolate({
                inputRange: MATCH_TIMES,
                outputRange: [...player.x],
              }),
            },
            {
              translateY: clock.interpolate({
                inputRange: MATCH_TIMES,
                outputRange: [...player.y],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.playerShadow} />
      <View style={[styles.arms, { backgroundColor: kitColor }]} />
      <View style={[styles.jersey, { backgroundColor: kitColor }]} />
      <View style={styles.shorts} />
      <View style={styles.bootLeft} />
      <View style={styles.bootRight} />
      <View style={styles.head} />
      <View style={styles.hair} />
    </Animated.View>
  );
}

function FootballPitch({
  clock,
  scale,
}: {
  clock: Animated.Value;
  scale: number;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ height: SCENE_HEIGHT * scale, width: SCENE_WIDTH * scale }}
    >
      <View
        style={[
          styles.scene,
          {
            left: (SCENE_WIDTH * (scale - 1)) / 2,
            top: (SCENE_HEIGHT * (scale - 1)) / 2,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={styles.pitchBase} />
        <View style={styles.pitch}>
          {STRIPES.map((stripe) => (
            <View
              key={stripe}
              style={[
                styles.stripe,
                { left: stripe * 36, opacity: stripe % 2 === 0 ? 0.04 : 0 },
              ]}
            />
          ))}
          <View style={styles.touchline} />
          <View style={styles.halfwayLine} />
          <View style={styles.centreCircle} />
          <View style={styles.centreSpot} />
          <View style={[styles.penaltyBox, styles.leftBox]} />
          <View style={[styles.penaltyBox, styles.rightBox]} />
          <View style={[styles.goalArea, styles.leftBox]} />
          <View style={[styles.goalArea, styles.rightBox]} />
        </View>
        <View style={[styles.goal, styles.goalLeft]} />
        <View style={[styles.goal, styles.goalRight]} />
        {PLAYERS.map((player) => (
          <FootballPlayer clock={clock} key={player.id} player={player} />
        ))}
        <Animated.View
          style={[
            styles.ball,
            {
              opacity: clock.interpolate({
                inputRange: [0, 0.8, 0.86, 0.94, 1],
                outputRange: [1, 1, 0, 0, 1],
              }),
              transform: [
                {
                  translateX: clock.interpolate({
                    inputRange: MATCH_TIMES,
                    outputRange: [125, 155, 224, 283, 296, 296, 125, 125],
                  }),
                },
                {
                  translateY: clock.interpolate({
                    inputRange: MATCH_TIMES,
                    outputRange: [124, 74, 121, 105, 105, 105, 124, 124],
                  }),
                },
                {
                  rotate: clock.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "1080deg"],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.ballPatch} />
        </Animated.View>
        <Animated.View
          style={[
            styles.goalBadge,
            {
              opacity: clock.interpolate({
                inputRange: [0, 0.62, 0.68, 0.79, 0.86, 1],
                outputRange: [0, 0, 1, 1, 0, 0],
              }),
            },
          ]}
        >
          <Text style={styles.goalText}>GOAL!</Text>
        </Animated.View>
      </View>
    </View>
  );
}

export function FootballLoader({
  description,
  label,
  paused = false,
  progress,
  state = "loading",
  variant = "page",
}: FootballLoaderProps) {
  const clock = useAnimatedValue(0);
  const [appActive, setAppActive] = useState(
    AppState.currentState === "active"
  );
  const reducedMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const compact = variant === "inline";
  const scale = compact
    ? 0.44
    : Math.min(1, Math.max(0.3, (width - 48) / SCENE_WIDTH));
  const actualProgress =
    progress !== undefined && Number.isFinite(progress)
      ? Math.round(Math.min(100, Math.max(0, progress)))
      : undefined;
  const defaultLabel = {
    error: "Something went offside",
    loading: "Getting the team ready",
    success: "You're all set",
  }[state];
  const statusLabel = label ?? defaultLabel;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      setAppActive(nextState === "active");
    });
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(clock, {
        duration: MATCH_DURATION,
        easing: (value) => Easing.linear(value),
        isInteraction: false,
        toValue: 1,
        useNativeDriver: true,
      })
    );
    if (state !== "loading" || reducedMotion || paused || !appActive) {
      clock.setValue(state === "success" ? 0.72 : 0);
    } else {
      clock.setValue(0);
      animation.start();
    }
    return () => {
      animation.stop();
    };
  }, [appActive, clock, paused, reducedMotion, state]);

  return (
    <View
      style={[
        styles.container,
        compact && styles.compact,
        variant === "splash" && styles.splash,
      ]}
    >
      {variant === "splash" && (
        <Text style={styles.wordmark}>
          huddlekit<Text style={styles.wordmarkDot}>.</Text>
        </Text>
      )}
      <FootballPitch clock={clock} scale={scale} />
      <View
        accessible
        accessibilityLabel={statusLabel}
        accessibilityHint={description}
        accessibilityLiveRegion="polite"
        accessibilityRole={state === "loading" ? "progressbar" : "text"}
        accessibilityValue={
          actualProgress === undefined
            ? { text: statusLabel }
            : { max: 100, min: 0, now: actualProgress }
        }
        style={[styles.copy, compact && styles.compactCopy]}
      >
        <Text
          style={[
            styles.label,
            compact && styles.compactLabel,
            state === "error" && styles.errorText,
          ]}
        >
          {statusLabel}
        </Text>
        {description !== undefined && (
          <Text style={styles.description}>{description}</Text>
        )}
        {actualProgress !== undefined && (
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${actualProgress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{actualProgress}%</Text>
          </View>
        )}
      </View>
      {variant === "splash" && (
        <Text style={styles.tagline}>A LITTLE MATCH. WHILE YOU WAIT.</Text>
      )}
    </View>
  );
}
