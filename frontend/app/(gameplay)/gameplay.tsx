import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { getCurrentLevel, getHint, postSubmitAnswer } from "@/src/services/gameplayService";
import { router } from "expo-router";

export default function GameplayScreen() {
    const [level, setLevel] = useState<any>(null);
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchLevel = async () => {
        try {
            const res = await getCurrentLevel();
            setLevel(res);
        } catch (err: any) {

            const data = err.response?.data;

            if (data?.locationLocked) {
                router.replace("/location");
                return;
            }

            Alert.alert("Error", "Failed to load level");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLevel();
    }, []);

    const submitAnswer = async (answer: string) => {
        try {
            const res = await postSubmitAnswer(answer);

            if (res?.locationLocked) {
                router.replace("/location");
                return;
            }
            router.replace("/location");
            setAnswer("");
        } catch (err: any) {
            const data = err.response?.data;

            if (data?.locationLocked) {
                router.replace("/location");
                return;
            }

            Alert.alert("Wrong Answer", data?.message || "Try again");
        }
    };

    const requestHint = async () => {
        try {
            const res = await getHint();

            Alert.alert("Hint", res.hint);
        } catch (err: any) {
            Alert.alert(
                "Hint Error",
                err.response?.data?.message || "Cannot get hint",
            );
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text>Loading level...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 px-6 pt-16 bg-white">
            <Text className="text-2xl font-bold mb-4">
                Level {level?.levelNumber}
            </Text>

            <View className="bg-gray-100 p-5 rounded-xl mb-6">
                <Text className="text-lg">{level?.question}</Text>
            </View>

            <TextInput
                placeholder="Enter your answer"
                value={answer}
                onChangeText={setAnswer}
                className="border border-gray-300 p-4 rounded-lg mb-4"
            />

            <TouchableOpacity
                onPress={() => submitAnswer(answer)}
                className="bg-blue-600 p-4 rounded-lg mb-4"
            >
                <Text className="text-white text-center font-semibold">
                    Submit Answer
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={requestHint}
                className="bg-yellow-500 p-4 rounded-lg"
            >
                <Text className="text-white text-center font-semibold">
                    Get Hint (-Penalty)
                </Text>
            </TouchableOpacity>
        </View>
    );
}