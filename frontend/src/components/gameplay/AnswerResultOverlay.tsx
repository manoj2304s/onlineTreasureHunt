import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import LottieView from "lottie-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = {
  variant: "success" | "restored" | null;
  onClose: () => void;
};

export function AnswerResultOverlay({ variant, onClose }: Props) {
  if (!variant) {
    return null;
  }

  const isSuccess = variant === "success";

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(180)}
      className="absolute inset-0 items-center justify-center bg-[#2a1709]/55"
    >
      <Animated.View
        entering={ZoomIn.duration(220)}
        className="w-72 rounded-3xl border border-[#f0cc88] bg-[#fff5e1] px-5 py-5"
      >
        <TouchableOpacity onPress={onClose} className="absolute right-3 top-3 z-10 p-1">
          <MaterialCommunityIcons name="close" size={22} color="#7a4a24" />
        </TouchableOpacity>

        <View className="items-center">
          {isSuccess ? (
            <LottieView
              source={require("../../../assets/animations/treasure-burst.json")}
              autoPlay
              loop={false}
              style={{ width: 120, height: 120 }}
            />
          ) : (
            <Text className="text-6xl text-red-500">{"\u2665"}</Text>
          )}
          <Text className="mt-1 text-center text-xl font-bold text-[#6b3f1f]">
            {isSuccess ? "Correct answer!" : "Life restored"}
          </Text>
          <Text className="mt-1 text-center text-sm text-[#8f5c31]">
            {isSuccess
              ? "Heading to next location..."
              : "You can submit answers again."}
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}
