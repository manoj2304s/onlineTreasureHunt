import { useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import * as Location from "expo-location";
import { router } from "expo-router";
import { calculateDistance } from "../../src/utils/calculateDistance";
import { getCurrentLevel } from "../../src/services/gameplayService";

type TargetLocation = {
  latitude: number;
  longitude: number;
};

export default function LocationScreen() {
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const level = await getCurrentLevel();

        if (isMounted) {
          await startTracking(level.location);
        }
      } catch (err: any) {
  
        if (err.response?.status === 404) {
          router.replace("/completed");
          return;
        }

        if (isMounted) {
          setError("Failed to load level. Please try again.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, []);

  const startTracking = async (targetLocation: TargetLocation) => {
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
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <Text className="text-gray-500 mt-2">Loading level...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-red-500 text-lg text-center">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center p-6">
      <Text className="text-3xl font-bold mb-4">Reach The Location</Text>
      <Text className="text-lg mb-4">Distance Remaining</Text>
      <Text className="text-4xl font-bold mb-8">
        {distance ?? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" />
          </View>
        )}{" "}
        m
      </Text>

      {distance !== null && distance < 30 && (
        <TouchableOpacity
          className="bg-green-600 px-6 py-3 rounded-lg"
          onPress={() => router.replace("/scan")}
        >
          <Text className="text-white text-lg">Scan QR Code</Text>
        </TouchableOpacity>
      )}

      {distance !== null && distance >= 30 && (
        <Text className="text-gray-500">Scanner unlocks when within 30m</Text>
      )}
    </View>
  );
}
