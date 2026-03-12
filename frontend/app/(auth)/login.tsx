import { useContext, useEffect, useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { login as loginAPI } from "@/src/services/authService";
import { AuthContext } from "@/src/context/AuthContext";
import { TreasureBackground } from "@/src/components/ui/TreasureBackground";
import { InlineBanner } from "@/src/components/ui/InlineBanner";
import { useAppFeedback } from "@/src/hooks/useAppFeedback";
import { isValidEmail } from "@/src/utils/validation";

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const { reason } = useLocalSearchParams<{ reason?: string | string[] }>();
  const feedback = useAppFeedback();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const normalizedPassword = useMemo(() => password.trim(), [password]);

  useEffect(() => {
    const reasonValue = Array.isArray(reason) ? reason[0] : reason;
    if (reasonValue === "session_expired") {
      feedback.showWarning("Session expired. Please log in again.");
      router.replace("/login");
    }
  }, [feedback, reason]);

  const validate = () => {
    if (!normalizedEmail || !normalizedPassword) {
      return "Email and password are required.";
    }
    if (!isValidEmail(normalizedEmail)) {
      return "Please enter a valid email address.";
    }
    return null;
  };

  const handleLogin = async () => {
    const error = validate();
    setInlineError(error);

    if (error) {
      feedback.showWarning(error);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await loginAPI(normalizedEmail, normalizedPassword);
      await login(res.token);
      feedback.showSuccess("Welcome back.");
      router.replace("/home");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        (err.message === "Network Error"
          ? "Cannot reach server. Check EXPO_PUBLIC_API_URL."
          : err.message) ||
        "Login failed.";

      setInlineError(errorMessage);
      feedback.showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TreasureBackground className="flex-row items-center justify-center px-6">
      <View className="w-full max-w-[420px] rounded-3xl border border-[#c48f57] bg-[#fff7e9] p-6">
        <Text className="text-center text-4xl font-black text-[#5b3218]">Login</Text>
        <Text className="mt-1 text-center text-sm text-[#8f5c31]">
          Continue your treasure run
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#9a7a55"
          className="mt-6 rounded-xl border border-[#c48f57] bg-[#fffdf6] p-4 text-[#5b3218]"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (inlineError) setInlineError(null);
          }}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#9a7a55"
          className="mt-3 rounded-xl border border-[#c48f57] bg-[#fffdf6] p-4 text-[#5b3218]"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (inlineError) setInlineError(null);
          }}
        />

        {inlineError && (
          <View className="mt-3">
            <InlineBanner message={inlineError} tone="warning" />
          </View>
        )}

        <TouchableOpacity
          onPress={handleLogin}
          disabled={isSubmitting}
          className={`mt-4 rounded-xl p-4 ${isSubmitting ? "bg-[#c49a73]" : "bg-[#7a4a24]"}`}
        >
          <Text className="text-center text-lg font-bold text-white">
            {isSubmitting ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-5" onPress={() => router.replace("/register")}>
          <Text className="text-center font-semibold text-[#7a4a24]">
            Don&apos;t have an account? Register
          </Text>
        </TouchableOpacity>
      </View>
    </TreasureBackground>
  );
}
