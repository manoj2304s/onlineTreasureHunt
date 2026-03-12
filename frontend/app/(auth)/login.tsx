import { useState, useContext, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { login as loginAPI } from "@/src/services/authService";
import { AuthContext } from "@/src/context/AuthContext";
import { useToast } from "react-native-toast-notifications";

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const { reason } = useLocalSearchParams<{ reason?: string | string[] }>();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const reasonValue = Array.isArray(reason) ? reason[0] : reason;

    if (reasonValue === "session_expired") {
      toast.show("Session expired. Please log in again.", {
        type: "danger",
        placement: "top",
      });

      router.replace("/login");
    }
  }, [reason, toast]);

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      toast.show("Email and password are required", {
        type: "danger",
        placement: "top",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await loginAPI(normalizedEmail, normalizedPassword);

      await login(res.token);

      router.replace("/home");
    } catch (error: any) {
      console.log(error.response?.data || error.message);
      const errorMessage =
        error.response?.data?.message ||
        (error.message === "Network Error"
          ? "Cannot reach server. Check EXPO_PUBLIC_API_URL and use HTTPS or enable cleartext traffic for Android builds."
          : error.message) ||
        "Login failed";

      toast.show(errorMessage, {
        type: "danger",
        placement: "top",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold text-center mb-10">
        Login
      </Text>

      <TextInput
        placeholder="Email"
        className="border border-gray-300 rounded-lg p-4 mb-4"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        className="border border-gray-300 rounded-lg p-4 mb-6"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        onPress={handleLogin}
        disabled={isSubmitting}
        className="bg-blue-600 p-4 rounded-lg"
      >
        <Text className="text-white text-center font-semibold text-lg">
          {isSubmitting ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>

      <Text
        className="text-center text-blue-600 mt-6"
        onPress={() => router.push("/register")}
      >
        Dont have an account? Register
      </Text>
    </View>
  );
}
