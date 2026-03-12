import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import * as Location from "expo-location";
import { router } from "expo-router";
import { calculateDistance } from "@/src/utils/calculateDistance";
import { getCurrentLevel } from "@/src/services/gameplayService";
import { TreasureBackground } from "@/src/components/ui/TreasureBackground";
import { InlineBanner } from "@/src/components/ui/InlineBanner";

type TargetLocation = {
  latitude: number;
  longitude: number;
};

export default function LocationScreen() {
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const stopTracking = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
  }, []);

  const startTracking = useCallback(async (targetLocation: TargetLocation) => {
    if (subscriptionRef.current) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError("Location permission is required to play.");
      return;
    }

    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,
      },
      (loc) => {
        const d = calculateDistance(
          loc.coords.latitude,
          loc.coords.longitude,
          targetLocation.latitude,
          targetLocation.longitude,
        );
        setDistance(Math.round(d));
      },
    );
  }, []);

  const init = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const level = await getCurrentLevel();
      if (!level.location) {
        setError("Location data is unavailable for this level.");
        return;
      }
      await startTracking(level.location);
    } catch (err: any) {
      if (err.response?.status === 404) {
        router.replace("/completed");
        return;
      }

      if (err.response?.status === 403 && err.response?.data?.locationLocked) {
        router.replace("/scan");
        return;
      }

      setError(err.response?.data?.message || "Failed to load location.");
    } finally {
      setLoading(false);
    }
  }, [startTracking]);

  useEffect(() => {
    init();
    return () => {
      stopTracking();
    };
  }, [init, stopTracking]);

  if (loading) {
    return (
      <TreasureBackground className="items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-[#7a4a24]">Loading location...</Text>
      </TreasureBackground>
    );
  }

  if (error) {
    return (
      <TreasureBackground className="items-center justify-center px-6">
        <InlineBanner message={error} tone="error" />
        <TouchableOpacity
          className="mt-4 rounded-xl bg-[#7a4a24] px-6 py-3"
          onPress={init}
        >
          <Text className="text-center font-semibold text-white">Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="mt-3 rounded-xl border border-[#7a4a24] px-6 py-3"
          onPress={() => router.replace("/home")}
        >
          <Text className="text-center font-semibold text-[#7a4a24]">Back Home</Text>
        </TouchableOpacity>
      </TreasureBackground>
    );
  }

  return (
    <TreasureBackground className="flex-row items-center justify-center px-6">
      <View className="w-full max-w-[430px] rounded-3xl border border-[#c48f57] bg-[#fff7e9] p-6">
        <Text className="text-center text-3xl font-black text-[#5b3218]">
          Reach The Location
        </Text>
        <Text className="mt-2 text-center text-base text-[#8f5c31]">
          Distance Remaining
        </Text>
        <Text className="mt-4 text-center text-5xl font-black text-[#5b3218]">
          {distance ?? "--"} m
        </Text>

        {distance !== null && distance < 30 ? (
          <TouchableOpacity
            className="mt-7 rounded-xl bg-[#1d824b] px-6 py-3"
            onPress={() => router.replace("/scan")}
          >
            <Text className="text-center text-lg font-semibold text-white">
              Scan QR Code
            </Text>
          </TouchableOpacity>
        ) : (
          <Text className="mt-5 text-center text-sm font-semibold text-[#8f5c31]">
            Scanner unlocks when you are within 30m.
          </Text>
        )}
      </View>
    </TreasureBackground>
  );
}
