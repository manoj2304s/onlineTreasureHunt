import { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { login as loginAPI } from "@/src/services/authService";
import { AuthContext } from "@/src/context/AuthContext";

export default function LoginScreen() {
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await loginAPI(email, password);

      await login(res.token);

      router.replace("/home");
    } catch (error: any) {
      console.log(error.response?.data || error.message);

      Alert.alert(
        "Login Failed",
        error.response?.data?.message || "Something went wrong"
      );
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