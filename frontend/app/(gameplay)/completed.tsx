import { Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TreasureBackground } from "@/src/components/ui/TreasureBackground";

export default function CompletedScreen() {
  return (
    <TreasureBackground className="flex-row justify-center items-center px-6">
      <View className="w-full max-w-[430px] items-center rounded-3xl border border-[#c48f57] bg-[#fff7e9] px-6 py-8">
        <LottieView
          source={require("../../assets/animations/treasure-burst.json")}
          autoPlay
          loop={false}
          style={{ width: 130, height: 130 }}
        />
        <MaterialCommunityIcons
          name="trophy-award"
          size={44}
          color="#7a4a24"
          style={{ marginTop: -14 }}
        />

        <Text className="-mt-1 text-center text-3xl font-black text-[#5b3218]">
          Congratulations
        </Text>

        <Text className="mt-3 text-center text-base text-[#7a4a24]">
          You completed the treasure hunt successfully.
        </Text>

        <TouchableOpacity
          onPress={() => router.replace("/home")}
          className="mt-7 rounded-xl bg-[#7a4a24] px-6 py-4"
        >
          <Text className="text-lg font-semibold text-white">Back to Home</Text>
        </TouchableOpacity>
      </View>
    </TreasureBackground>
  );
}
