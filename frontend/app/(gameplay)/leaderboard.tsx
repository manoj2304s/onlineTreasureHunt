import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { router, useFocusEffect } from "expo-router";
import { socket } from "@/src/services/socketService";
import { getLeaderboard } from "@/src/services/gameplayService";
import { TreasureBackground } from "@/src/components/ui/TreasureBackground";
import { InlineBanner } from "@/src/components/ui/InlineBanner";
import { useAppFeedback } from "@/src/hooks/useAppFeedback";
import { LeaderboardEntry } from "@/src/types/gameplay";

type RowMovement = "up" | "down" | "same";

const AnimatedRow = ({
  item,
  index,
  movement,
}: {
  item: LeaderboardEntry;
  index: number;
  movement: RowMovement;
}) => {
  const movementPulse = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (movement === "same") return;
    scale.value = withSequence(
      withTiming(1.03, { duration: 160, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 230, easing: Easing.inOut(Easing.quad) }),
    );
    movementPulse.value = withSequence(
      withTiming(1, { duration: 170 }),
      withTiming(0, { duration: 330 }),
    );
  }, [movement, movementPulse, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: movementPulse.value * 0.22,
  }));

  const movementText = movement === "up" ? "UP" : movement === "down" ? "DOWN" : "";
  const podiumStyle =
    index === 0
      ? "border-yellow-400 bg-yellow-100"
      : index === 1
        ? "border-slate-400 bg-slate-100"
        : index === 2
          ? "border-orange-400 bg-orange-100"
          : "";
  const movementStyle = podiumStyle
    ? podiumStyle
    : movement === "up"
      ? "border-emerald-300 bg-emerald-50"
      : movement === "down"
        ? "border-orange-300 bg-orange-50"
        : "border-[#dab07d] bg-[#fff7e9]";

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(20).stiffness(220)}
      entering={FadeInDown.duration(220)}
      exiting={FadeOutUp.duration(180)}
      style={animatedStyle}
      className={`mb-3 flex-row items-center rounded-2xl border px-3 py-3 ${movementStyle}`}
    >
      <View className="w-12 items-center">
        <Text className="text-lg font-black text-[#5b3218]">#{index + 1}</Text>
      </View>

      <View className="flex-1">
        <Text className="text-lg font-bold text-[#5b3218]">{item.username}</Text>
        {movementText ? (
          <Text
            className={`text-xs font-bold ${
              movement === "up" ? "text-emerald-700" : "text-orange-700"
            }`}
          >
            {movement === "up" ? "\u2191 " : "\u2193 "}
            {movementText}
          </Text>
        ) : (
          <Text className="text-xs text-[#8f5c31]">Stable</Text>
        )}
      </View>

      <View className="mr-3 items-center">
        <Text className="text-xs text-[#8f5c31]">Level</Text>
        <Text className="text-lg font-black text-[#5b3218]">{item.currentLevel}</Text>
      </View>

      <View className="w-20 items-end">
        <Text className="text-xs text-[#8f5c31]">Time</Text>
        <Text className="text-base font-bold text-[#5b3218]">
          {formatTime(item.time)}
        </Text>
      </View>
    </Animated.View>
  );
};

function formatTime(seconds: number | null | undefined) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
    return "--:--";
  }

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function LeaderboardSkeleton() {
  return (
    <View className="mt-2">
      {Array.from({ length: 6 }, (_, index) => (
        <View
          key={`skeleton-${index}`}
          className="mb-3 h-[74px] rounded-2xl border border-[#dab07d] bg-[#f4dfb8]"
        />
      ))}
    </View>
  );
}

export default function LeaderboardScreen() {
  const feedback = useAppFeedback();
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number>(Date.now());
  const [movementMap, setMovementMap] = useState<Record<string, RowMovement>>({});
  const livePulse = useSharedValue(1);
  const previousPositionsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!isConnected) {
      livePulse.value = 1;
      return;
    }

    livePulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 380 }),
        withTiming(0.68, { duration: 380 }),
      ),
      -1,
      true,
    );
  }, [isConnected, livePulse]);

  const liveBadgeStyle = useAnimatedStyle(() => ({
    opacity: livePulse.value,
  }));

  const hydrateRows = useCallback((nextRows: LeaderboardEntry[]) => {
    const nextMovement: Record<string, RowMovement> = {};
    nextRows.forEach((entry, nextIndex) => {
      const prevIndex = previousPositionsRef.current.get(entry.id);
      if (prevIndex === undefined) {
        nextMovement[entry.id] = "same";
      } else if (nextIndex < prevIndex) {
        nextMovement[entry.id] = "up";
      } else if (nextIndex > prevIndex) {
        nextMovement[entry.id] = "down";
      } else {
        nextMovement[entry.id] = "same";
      }
    });

    previousPositionsRef.current = new Map(
      nextRows.map((entry, index) => [entry.id, index]),
    );
    setMovementMap(nextMovement);
    setPlayers(nextRows);
    setLastUpdatedAt(Date.now());
  }, []);

  const loadLeaderboard = useCallback(async (silent = false) => {
    if (!silent) {
      setScreenError(null);
      setLoading(true);
    }
    try {
      const data = await getLeaderboard();
      hydrateRows(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setScreenError(error.response?.data?.message || "Failed to fetch leaderboard.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [hydrateRows]);

  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();

      if (!socket.connected) {
        socket.connect();
      }

      const handleLeaderboardUpdate = (data: LeaderboardEntry[] | { leaderboard: LeaderboardEntry[] }) => {
        const rows = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.leaderboard)
            ? (data as any).leaderboard
            : [];
        if (!rows.length) return;
        hydrateRows(rows);
      };

      const handleConnect = () => {
        setIsConnected(true);
        loadLeaderboard(true);
      };
      const handleDisconnect = () => {
        setIsConnected(false);
        feedback.showWarning("Realtime updates disconnected.");
      };

      socket.on("leaderboard:update", handleLeaderboardUpdate);
      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);

      const poll = setInterval(() => {
        loadLeaderboard(true);
      }, 5000);

      return () => {
        clearInterval(poll);
        socket.off("leaderboard:update", handleLeaderboardUpdate);
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
      };
    }, [feedback, hydrateRows, loadLeaderboard]),
  );

  const lastUpdatedText = useMemo(() => {
    const date = new Date(lastUpdatedAt);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }, [lastUpdatedAt]);

  return (
    <TreasureBackground>
      <View className="flex-1 px-5 pb-8 pt-14">
        <View className="mb-4 flex-row items-start justify-between">
          <View>
            <Text className="text-3xl font-black text-[#5b3218]">Leaderboard</Text>
            <Text className="mt-1 text-xs font-semibold text-[#8f5c31]">
              Last update: {lastUpdatedText}
            </Text>
          </View>
          <View
            className={`rounded-full px-3 py-1 ${
              isConnected ? "bg-emerald-600" : "bg-orange-600"
            }`}
          >
            <Animated.Text style={liveBadgeStyle} className="text-xs font-bold text-white">
              {isConnected ? "LIVE" : "OFFLINE"}
            </Animated.Text>
          </View>
        </View>

        {screenError ? (
          <View>
            <InlineBanner message={screenError} tone="error" />
            <TouchableOpacity
              className="mt-3 rounded-xl bg-[#7a4a24] px-5 py-3"
              onPress={() => loadLeaderboard()}
            >
              <Text className="text-center font-semibold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <LeaderboardSkeleton />
        ) : players.length === 0 ? (
          <InlineBanner message="No players have started yet." tone="info" />
        ) : (
          <FlatList
            data={players}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item, index }) => (
              <AnimatedRow
                item={item}
                index={index}
                movement={movementMap[item.id] ?? "same"}
              />
            )}
          />
        )}

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-auto rounded-xl bg-[#7a4a24] px-4 py-3"
        >
          <Text className="text-center font-semibold text-white">Back</Text>
        </TouchableOpacity>
      </View>
    </TreasureBackground>
  );
}
