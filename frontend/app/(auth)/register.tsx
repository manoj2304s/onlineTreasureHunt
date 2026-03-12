import { useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { register } from "@/src/services/authService";
import { TreasureBackground } from "@/src/components/ui/TreasureBackground";
import { InlineBanner } from "@/src/components/ui/InlineBanner";
import { useAppFeedback } from "@/src/hooks/useAppFeedback";
import { isStrongEnoughPassword, isValidEmail } from "@/src/utils/validation";

export default function RegisterScreen() {
  const feedback = useAppFeedback();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const normalizedName = useMemo(() => name.trim(), [name]);
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const normalizedPassword = useMemo(() => password.trim(), [password]);

  const validate = () => {
    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      return "All fields are required.";
    }
    if (normalizedName.length < 3) {
      return "Name must be at least 3 characters.";
    }
    if (!isValidEmail(normalizedEmail)) {
      return "Please enter a valid email address.";
    }
    if (!isStrongEnoughPassword(normalizedPassword)) {
      return "Password must be at least 6 characters.";
    }
    return null;
  };

  const handleRegister = async () => {
    const error = validate();
    setInlineError(error);

    if (error) {
      feedback.showWarning(error);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await register(normalizedName, normalizedEmail, normalizedPassword);
      feedback.showSuccess("Account created successfully.");
      router.replace("/login");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        (err.message === "Network Error"
          ? "Cannot reach server. Check EXPO_PUBLIC_API_URL."
          : err.message) ||
        "Registration failed.";

      setInlineError(errorMessage);
      feedback.showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TreasureBackground className="flex-row items-center justify-center px-6">
      <View className="w-full max-w-[420px] rounded-3xl border border-[#c48f57] bg-[#fff7e9] p-6">
        <Text className="text-center text-4xl font-black text-[#5b3218]">
          Register
        </Text>
        <Text className="mt-1 text-center text-sm text-[#8f5c31]">
          Join the hunt
        </Text>

        <TextInput
          placeholder="Team Name"
          placeholderTextColor="#9a7a55"
          className="mt-6 rounded-xl border border-[#c48f57] bg-[#fffdf6] p-4 text-[#5b3218]"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (inlineError) setInlineError(null);
          }}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#9a7a55"
          className="mt-3 rounded-xl border border-[#c48f57] bg-[#fffdf6] p-4 text-[#5b3218]"
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
          autoComplete="new-password"
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
          onPress={handleRegister}
          disabled={isSubmitting}
          className={`mt-4 rounded-xl p-4 ${isSubmitting ? "bg-[#c49a73]" : "bg-[#7a4a24]"}`}
        >
          <Text className="text-center text-lg font-bold text-white">
            {isSubmitting ? "Creating account..." : "Register"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-5" onPress={() => router.replace("/login")}>
          <Text className="text-center font-semibold text-[#7a4a24]">
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </View>
    </TreasureBackground>
  );
}
