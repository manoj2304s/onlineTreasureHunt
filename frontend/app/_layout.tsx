import "../global.css";
import { Stack } from "expo-router";
import { AuthProvider } from "../src/context/AuthContext";
import { ToastProvider } from "react-native-toast-notifications";

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider placement="top" offsetTop={56}>
        <Stack screenOptions={{ headerShown: false }} />
      </ToastProvider>
    </AuthProvider>
  );
}
