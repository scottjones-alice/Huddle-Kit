import "@/global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { View } from "react-native";

import { FootballSplash } from "@/components/football-splash";

export default function RootLayout() {
  const [contentReady, setContentReady] = useState(false);

  return (
    <>
      <StatusBar style="auto" />
      <FootballSplash ready={contentReady}>
        <View
          className="flex-1"
          onLayout={() => {
            setContentReady(true);
          }}
        >
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </FootballSplash>
    </>
  );
}
