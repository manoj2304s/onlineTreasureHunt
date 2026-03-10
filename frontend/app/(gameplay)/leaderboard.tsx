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

  return (
    <View className="flex-1 p-6 bg-white">
      <Text className="text-2xl font-bold mb-6">Leaderboard</Text>

      <FlatList
        data={players}
        keyExtractor={(item) => item.userId}
        renderItem={({ item, index }) => (
          <View className="flex-row justify-between py-3 border-b">
            <Text className="font-semibold">#{index + 1}</Text>

            <Text>{item.name}</Text>

            <Text>Level {item.currentLevel}</Text>
          </View>
        )}
      />
    </View>
  );
}
