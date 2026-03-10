import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function CompletedScreen() {
    return (
        <View className="flex-1 justify-center items-center px-6 bg-white">

            <Text className="text-4xl font-bold mb-6">
                🎉 Congratulations!
            </Text>

            <Text className="text-lg text-center mb-8">
                You have successfully completed the Treasure Hunt.
            </Text>

            <TouchableOpacity
                onPress={() => router.replace("/home")}
                className="bg-blue-600 px-6 py-4 rounded-lg"
            >
                <Text className="text-white text-lg font-semibold">
                    Back to Home
                </Text>
            </TouchableOpacity>

        </View>
    );
}