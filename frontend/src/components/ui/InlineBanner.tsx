import { Text, View } from "react-native";

type BannerTone = "error" | "warning" | "success" | "info";

const toneStyles: Record<BannerTone, string> = {
  error: "bg-red-100 border-red-300 text-red-800",
  warning: "bg-amber-100 border-amber-300 text-amber-900",
  success: "bg-emerald-100 border-emerald-300 text-emerald-900",
  info: "bg-blue-100 border-blue-300 text-blue-900",
};

type Props = {
  message: string;
  tone?: BannerTone;
};

export function InlineBanner({ message, tone = "info" }: Props) {
  return (
    <View className={`rounded-xl border px-4 py-3 ${toneStyles[tone]}`}>
      <Text className="font-medium">{message}</Text>
    </View>
  );
}
