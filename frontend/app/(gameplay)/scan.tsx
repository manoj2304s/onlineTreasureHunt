import { useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { unlockLocation } from "@/src/services/gameplayService";
import { useAppFeedback } from "@/src/hooks/useAppFeedback";

export default function ScanScreen() {
  const feedback = useAppFeedback();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const requestLockRef = useRef(false);
  const lastScanRef = useRef<{ payload: string; at: number } | null>(null);
  const nextAllowedScanAtRef = useRef(0);

  const handleScan = async ({ data }: { data?: string }) => {
    const now = Date.now();
    if (requestLockRef.current || scanned || loading) return;
    if (now < nextAllowedScanAtRef.current) return;

    const payload = (data ?? "").trim();
    if (!payload) {
      feedback.showWarning("Invalid QR payload. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => undefined,
      );
      return;
    }

    if (
      lastScanRef.current &&
      lastScanRef.current.payload === payload &&
      now - lastScanRef.current.at < 2500
    ) {
      return;
    }

    requestLockRef.current = true;
    setScanned(true);
    setLoading(true);
    lastScanRef.current = { payload, at: now };

    try {
      await unlockLocation(payload);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
      feedback.showSuccess("Location unlocked.");
      router.replace("/gameplay");
    } catch (err: any) {
      const message = err.response?.data?.message || "Invalid QR code.";
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => undefined,
      );
      feedback.showError(message);
      nextAllowedScanAtRef.current = Date.now() + 1800;
      setTimeout(() => {
        setScanned(false);
      }, 1800);
    } finally {
      setLoading(false);
      requestLockRef.current = false;
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f8e8c9]">
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f8e8c9] px-6">
        <Text className="mb-3 text-center text-lg font-semibold text-[#6b3f1f]">
          Camera permission is required to scan QR codes.
        </Text>
        <TouchableOpacity
          className="rounded-xl bg-[#7a4a24] px-6 py-3"
          onPress={requestPermission}
        >
          <Text className="font-semibold text-white">Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity className="mt-3" onPress={() => router.replace("/location")}>
          <Text className="text-sm font-semibold text-[#7a4a24]">Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={handleScan}
      />

      {loading && (
        <View className="absolute inset-0 items-center justify-center bg-black/55">
          <ActivityIndicator size="large" color="white" />
          <Text className="mt-2 font-semibold text-white">Verifying QR...</Text>
        </View>
      )}
    </View>
  );
}
