import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FootballLoader } from "@/components/football-loader";
import { FootballSplash } from "@/components/football-splash";

const PREVIEW_STEPS = [0, 25, 50, 75, 100];

const styles = StyleSheet.create({
  card: {
    borderColor: "#2e3833",
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  content: { gap: 16, padding: 20, paddingBottom: 48 },
  description: { color: "#a3b1a6", fontSize: 14, lineHeight: 21 },
  headingRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    marginTop: 16,
  },
  note: { color: "#a3b1a6", fontSize: 12, lineHeight: 18 },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#d4ff00",
    borderRadius: 24,
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  primaryButtonText: { color: "#101413", fontSize: 14, fontWeight: "700" },
  progressButton: {
    borderColor: "#45534a",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  progressControls: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  readyMark: { color: "#d4ff00", fontSize: 48 },
  readyScreen: {
    alignItems: "center",
    backgroundColor: "#101413",
    flex: 1,
    gap: 18,
    justifyContent: "center",
    padding: 20,
  },
  screen: { backgroundColor: "#101413", flex: 1 },
  secondaryButton: {
    borderColor: "#45534a",
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#d4e0d1",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  sectionTitle: {
    color: "#f1f4e9",
    fontSize: 17,
    fontWeight: "600",
    marginTop: 12,
  },
  selectedButton: { backgroundColor: "#d4ff00", borderColor: "#d4ff00" },
  selectedText: { color: "#101413" },
  splashPreview: {
    borderColor: "#45534a",
    borderRadius: 28,
    borderWidth: 1,
    height: 560,
    overflow: "hidden",
  },
  title: {
    color: "#f1f4e9",
    fontSize: 29,
    fontWeight: "700",
    letterSpacing: -1,
  },
});

export default function LoadingPreview() {
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(50);
  const [splashKey, setSplashKey] = useState(0);
  const [ready, setReady] = useState(false);

  const replaySplash = () => {
    setReady(false);
    setSplashKey((value) => value + 1);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          A little match. While you wait.
        </Text>
        <Text style={styles.description}>
          Preview the loading illustrations and transitions.
        </Text>
        <View style={styles.headingRow}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Page loading
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: paused }}
            onPress={() => {
              setPaused((value) => !value);
            }}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>
              {paused ? "Play animation" : "Pause animation"}
            </Text>
          </Pressable>
        </View>
        <View style={styles.card}>
          <FootballLoader
            description="Your next page is warming up."
            paused={paused}
          />
        </View>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          File upload
        </Text>
        <FootballLoader
          description="Upload preview"
          label={progress === 100 ? "File ready" : "Sending your file"}
          paused={paused}
          progress={progress}
          state={progress === 100 ? "success" : "loading"}
          variant="inline"
        />
        <View style={styles.progressControls}>
          {PREVIEW_STEPS.map((step) => (
            <Pressable
              accessibilityLabel={`Preview ${step} percent progress`}
              accessibilityRole="button"
              accessibilityState={{ selected: progress === step }}
              key={step}
              onPress={() => {
                setProgress(step);
              }}
              style={[
                styles.progressButton,
                progress === step && styles.selectedButton,
              ]}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  progress === step && styles.selectedText,
                ]}
              >
                {step}%
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.note}>
          Preview only. Real uploads use the actual transferred bytes.
        </Text>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Mobile splash
        </Text>
        <View style={styles.splashPreview}>
          <FootballSplash key={splashKey} paused={paused} ready={ready}>
            <View style={styles.readyScreen}>
              <Text style={styles.readyMark}>✓</Text>
              <Text style={styles.title}>Ready for kick-off.</Text>
              <Text style={styles.description}>
                Your content appears as soon as it is ready.
              </Text>
            </View>
          </FootballSplash>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={
            ready
              ? replaySplash
              : () => {
                  setReady(true);
                }
          }
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            {ready ? "Replay splash" : "Content ready — show transition"}
          </Text>
        </Pressable>
        <Text style={styles.note}>
          The device’s Reduce Motion setting keeps the pitch still and removes
          the fade.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
