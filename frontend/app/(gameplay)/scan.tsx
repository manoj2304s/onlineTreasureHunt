import { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { unlockLocation } from "@/src/services/gameplayService";
import { InlineBanner } from "@/src/components/ui/InlineBanner";
import { useAppFeedback } from "@/src/hooks/useAppFeedback";

export default function ScanScreen() {
  const feedback = useAppFeedback();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);

  const handleScan = async ({ data }: { data?: string }) => {
    if (scanned || loading) return;

    const payload = (data ?? "").trim();
    if (!payload) {
      feedback.showWarning("Invalid QR payload. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => undefined,
      );
      return;
    }

    setScanned(true);
    setLoading(true);
    setScreenError(null);

    try {
      await unlockLocation(payload);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
      feedback.showSuccess("Location unlocked.");
      router.replace("/gameplay");
    } catch (err: any) {
      const message = err.response?.data?.message || "Invalid QR code.";
      setScreenError(message);
      setScanned(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => undefined,
      );
      feedback.showError(message);
    } finally {
      setLoading(false);
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

      {screenError && (
        <View className="absolute left-4 right-4 top-14">
          <InlineBanner message={screenError} tone="error" />
        </View>
      )}

      {loading && (
        <View className="absolute inset-0 items-center justify-center bg-black/55">
          <ActivityIndicator size="large" color="white" />
          <Text className="mt-2 font-semibold text-white">Verifying QR...</Text>
        </View>
      )}
    </View>
  );
}
