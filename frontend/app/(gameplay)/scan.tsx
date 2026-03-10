import { useState } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { unlockLocation } from "../../src/services/gameplayService";

export default function ScanScreen() {

    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!permission) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View className="flex-1 justify-center items-center p-6">
                <Text className="mb-4 text-lg text-center">
                    Camera permission is required to scan QR codes
                </Text>

                <Text
                    className="text-blue-500 text-lg"
                    onPress={requestPermission}
                >
                    Grant Permission
                </Text>
            </View>
        );
    }

    const handleScan = async ({ data }: any) => {

        if (scanned) return;

        setScanned(true);
        setLoading(true);
        console.log("Scanned QR Code:", data);
        try {

            await unlockLocation(data);
    
            Alert.alert("Success", "Location unlocked!");

            router.replace("/gameplay");

        } catch (err: any) {

            console.log(err.response?.data);

            Alert.alert("Error", "Invalid QR code");

            setScanned(false);

        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1">

            <CameraView
                style={{ flex: 1 }}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                onBarcodeScanned={handleScan}
            />

            {loading && (
                <View className="absolute inset-0 justify-center items-center bg-black/40">
                    <ActivityIndicator size="large" color="white" />
                    <Text className="text-white mt-2">
                        Verifying QR...
                    </Text>
                </View>
            )}

        </View>
    );
}