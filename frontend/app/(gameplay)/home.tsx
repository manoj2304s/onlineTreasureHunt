import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { getCurrentLevel } from "@/src/services/gameplayService";
import { getMe } from "@/src/services/authService";
import { removeToken } from "@/src/utils/storage";
import { TreasureBackground } from "@/src/components/ui/TreasureBackground";
import { InlineBanner } from "@/src/components/ui/InlineBanner";
import { useAppFeedback } from "@/src/hooks/useAppFeedback";

export default function HomeScreen() {
  const feedback = useAppFeedback();
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState("");
  const [currentLevel, setCurrentLevel] = useState<number | null>(null);
  const [continueLoading, setContinueLoading] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setScreenError(null);
    try {
      const userRes = await getMe();
      setPlayerName(userRes.username);
      const completed = Boolean(userRes.gameCompletedAt);

      if (completed) {
        const finalLevel = Math.max((userRes.currentLevel ?? 1) - 1, 1);
        setCurrentLevel(finalLevel);
        return;
      }

      const levelRes = await getCurrentLevel();
      setCurrentLevel(levelRes.levelNumber);
    } catch (err: any) {
      setScreenError(err.response?.data?.message || "Failed to load home dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await removeToken();
    feedback.showInfo("Logged out.");
    router.replace("/login");
  };

  const handleContinue = async () => {
    if (continueLoading) return;

    setContinueLoading(true);
    try {
      const userRes = await getMe();

      if (userRes.gameCompletedAt) {
        router.replace("/completed");
        return;
      }

      if (userRes.locationUnlocked) {
        router.push("/gameplay");
      } else {
        router.push("/location");
      }
    } catch (err: any) {
      feedback.showWarning(err.response?.data?.message || "Syncing player state failed.");
      // Safe default: force location path to avoid gameplay bypass.
      router.push("/location");
    } finally {
      setContinueLoading(false);
    }
  };

  if (loading) {
    return (
      <TreasureBackground className="items-center justify-center">
        <ActivityIndicator />
      </TreasureBackground>
    );
  }

  return (
    <TreasureBackground className="items-center justify-center px-6">
      <View className="w-full max-w-[420px] rounded-3xl border border-[#c48f57] bg-[#fff7e9] p-6">
        <Text className="text-center text-4xl font-black text-[#5b3218]">
          Treasure Hunt
        </Text>
        <Text className="mt-2 text-center text-base text-[#7a4a24]">
          Welcome, {playerName}
        </Text>
        <Text className="mt-1 text-center text-sm text-[#8f5c31]">
          Current Level: {currentLevel}
        </Text>

        {screenError && (
          <View className="mt-4">
            <InlineBanner message={screenError} tone="error" />
          </View>
        )}

        <TouchableOpacity
          className="mt-5 rounded-xl bg-[#7a4a24] px-6 py-3"
          disabled={continueLoading}
          onPress={handleContinue}
        >
          <Text className="text-center text-lg font-bold text-white">
            {continueLoading ? "Checking..." : "Continue"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-3 rounded-xl border border-[#7a4a24] px-6 py-3"
          onPress={() => router.push("/leaderboard")}
        >
          <Text className="text-center text-lg font-semibold text-[#7a4a24]">
            View Leaderboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-3 rounded-xl bg-[#b0432f] px-6 py-3"
          onPress={handleLogout}
        >
          <Text className="text-center text-lg font-semibold text-white">
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </TreasureBackground>
  );
}
