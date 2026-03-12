import { ReactNode } from "react";
import { View } from "react-native";

type Props = {
  children: ReactNode;
  className?: string;
};

export function TreasureBackground({ children, className = "" }: Props) {
  return (
    <View className={`flex-1 bg-[#f8e8c9] ${className}`}>
      <View className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[#f7d08a]/40" />
      <View className="absolute top-1/3 -left-20 h-52 w-52 rounded-full bg-[#d98b52]/20" />
      <View className="absolute bottom-10 right-4 h-36 w-36 rounded-full bg-[#c45b3d]/20" />
      <View className="flex-1">{children}</View>
    </View>
  );
}
