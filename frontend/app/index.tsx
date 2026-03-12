import { useContext, useEffect } from "react";
import { AuthContext } from "../src/context/AuthContext";
import { router } from "expo-router";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { token, loading } = useContext(AuthContext);

  useEffect(() => {
    if (!loading) {
      if (token) {
        router.replace("/home");
      } else {
        router.replace("/login");
      }
    }
  }, [token, loading]);

  return (
    <View className="flex-1 flex-row justify-center items-center">
      <ActivityIndicator size="large" />
    </View>
  );
}