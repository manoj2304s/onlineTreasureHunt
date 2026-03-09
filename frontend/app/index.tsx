import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-3xl font-bold mb-10">
        Treasure Hunt
      </Text>

      <Pressable
        className="bg-blue-500 px-6 py-3 rounded mb-4"
        onPress={() => router.push("/login")}
      >
        <Text className="text-white text-lg">Login</Text>
      </Pressable>

      <Pressable
        className="bg-green-500 px-6 py-3 rounded"
        onPress={() => router.push("/register")}
      >
        <Text className="text-white text-lg">Register</Text>
      </Pressable>
    </View>
  );
}