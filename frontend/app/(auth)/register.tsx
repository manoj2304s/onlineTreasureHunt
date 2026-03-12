import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { register } from "@/src/services/authService";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      Alert.alert("Registration Failed", "All fields are required");
      return;
    }

    if (normalizedName.length < 3) {
      Alert.alert("Registration Failed", "Name must be at least 3 characters long");
      return;
    }

    if (normalizedPassword.length < 6) {
      Alert.alert("Registration Failed", "Password must be at least 6 characters long");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await register(normalizedName, normalizedEmail, normalizedPassword);

      console.log("REGISTER RESPONSE:", res);

      Alert.alert("Success", "Account created successfully");

      router.replace("/login");
    } catch (error: any) {
      console.log("REGISTER ERROR:", error.response?.data || error.message);
      const errorMessage =
        error.response?.data?.message ||
        (error.message === "Network Error"
          ? "Cannot reach server. Check EXPO_PUBLIC_API_URL and use HTTPS or enable cleartext traffic for Android builds."
          : error.message) ||
        "Something went wrong";

      Alert.alert(
        "Registration Failed",
        errorMessage
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold text-center mb-10">
        Register
      </Text>

      <TextInput
        placeholder="Name"
        className="border border-gray-300 rounded-lg p-4 mb-4"
        value={name}
        onChangeText={setName}
      />

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
        onPress={handleRegister}
        disabled={isSubmitting}
        className="bg-green-600 p-4 rounded-lg"
      >
        <Text className="text-white text-center font-semibold text-lg">
          {isSubmitting ? "Creating account..." : "Register"}
        </Text>
      </TouchableOpacity>

      <Text
        className="text-center text-blue-600 mt-6"
        onPress={() => router.push("/login")}
      >
        Already have an account? Login
      </Text>
    </View>
  );
}
