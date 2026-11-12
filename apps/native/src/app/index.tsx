import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-black">
      <Text className="text-2xl font-semibold text-black dark:text-white">
        huddlekit
      </Text>
      <Link
        className="mt-6 p-3 text-base text-black underline dark:text-white"
        href="/loading-preview"
      >
        Preview loading animations
      </Link>
    </View>
  );
}
