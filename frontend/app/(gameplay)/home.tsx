import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { getCurrentLevel } from "@/src/services/gameplayService";
import { getMe } from "@/src/services/authService";
import { removeToken } from "@/src/utils/storage";

export default function HomeScreen() {
    const [loading, setLoading] = useState(true);
    const [playerName, setPlayerName] = useState("");
    const [currentLevel, setCurrentLevel] = useState<number | null>(null);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const userRes = await getMe();
            setPlayerName(userRes.username);

            const levelRes = await getCurrentLevel();
            
            setCurrentLevel(levelRes.levelNumber);
        } catch (err) {
            console.log("Dashboard error:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator />
            </View>
        );
    }

    const handleLogout = async () => {
        await removeToken();
        router.replace("/login");
    };

    return (
        <View className="flex-1 justify-center items-center p-6">

            <Text className="text-3xl font-bold mb-4">
                Treasure Hunt
            </Text>

            <Text className="text-lg mb-2">
                Welcome, {playerName}
            </Text>

            <Text className="text-lg mb-6">
                Current Level: {currentLevel}
            </Text>

            <TouchableOpacity
                className="bg-blue-500 px-6 py-3 rounded-lg mb-4"
                onPress={() => router.push("/gameplay")}
            >
                <Text className="text-white text-lg">
                    Continue Game
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                className="bg-gray-800 px-6 py-3 rounded-lg mb-4"
                onPress={() => router.push("/leaderboard")}
            >
                <Text className="text-white text-lg">
                    View Leaderboard
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                className="bg-red-500 px-6 py-3 rounded-lg"
                onPress={handleLogout}
            >
                <Text className="text-white text-lg">
                    Logout
                </Text>
            </TouchableOpacity>

        </View>
    );
}