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
    try {
      const res = await loginAPI(email, password);

      await login(res.token);

      router.replace("/home");
    } catch (error: any) {
      console.log(error.response?.data || error.message);
      toast.show(error.response?.data?.message || "Login failed", {
        type: "danger",
        placement: "top",
      });
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
        className="bg-blue-600 p-4 rounded-lg"
      >
        <Text className="text-white text-center font-semibold text-lg">
          Login
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
