import { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { socket } from "../../src/services/socketService";

export default function LeaderboardScreen() {
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    socket.on("leaderboard:update", (data) => {
      setPlayers(data);
    });

    return () => {
      socket.off("leaderboard:update");
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <View className="flex-1 bg-gray-100 px-5 pt-16">
      <Text className="text-3xl font-bold text-center mb-6">
        🏆 Leaderboard
      </Text>

      {players.length === 0 ? (
        <Text className="text-center text-gray-500 mt-10">No players yet</Text>
      ) : (
        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item, index }) => {
            const isTop3 = index < 3;

            return (
              <View
                className={`flex-row items-center justify-between p-4 rounded-xl mb-3 ${
                  isTop3 ? "bg-yellow-100" : "bg-white"
                }`}
              >
                {/* Rank */}
                <View className="w-10 items-center">
                  <Text className="text-lg font-bold">
                    {index === 0
                      ? "🥇"
                      : index === 1
                        ? "🥈"
                        : index === 2
                          ? "🥉"
                          : `#${index + 1}`}
                  </Text>
                </View>

                {/* Username */}
                <View className="flex-1 ml-3">
                  <Text className="text-lg font-semibold">{item.username}</Text>
                </View>

                {/* Level */}
                <View className="items-center w-20">
                  <Text className="text-gray-600 text-sm">Level</Text>
                  <Text className="font-bold text-lg">{item.currentLevel}</Text>
                </View>

                {/* Time */}
                <View className="items-end w-20">
                  <Text className="text-gray-600 text-sm">Time</Text>
                  <Text className="font-bold text-lg">
                    {formatTime(item.time)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
