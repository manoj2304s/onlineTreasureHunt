import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { register } from "../../src/services/authService";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const res = await register(name, email, password);

      console.log("REGISTER RESPONSE:", res);

      Alert.alert("Success", "Account created successfully");

      router.replace("/login");
    } catch (error: any) {
      console.log("REGISTER ERROR:", error.response?.data || error.message);

      Alert.alert(
        "Registration Failed",
        error.response?.data?.message || "Something went wrong"
      );
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
        className="bg-green-600 p-4 rounded-lg"
      >
        <Text className="text-white text-center font-semibold text-lg">
          Register
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