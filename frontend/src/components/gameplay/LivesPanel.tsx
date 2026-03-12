import { useEffect, useMemo, useRef } from "react";
import { Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type Props = {
  remainingLives: number;
  countdownSeconds: number;
  locked: boolean;
  restorationAnimating?: boolean;
};

const HEART_COLOR = "#ef4444";

export function LivesPanel({
  remainingLives,
  countdownSeconds,
  locked,
  restorationAnimating = false,
}: Props) {
  const previousLivesRef = useRef(remainingLives);

  const opacity0 = useSharedValue(1);
  const opacity1 = useSharedValue(1);
  const opacity2 = useSharedValue(1);
  const scale0 = useSharedValue(1);
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const translateY0 = useSharedValue(0);
  const translateY1 = useSharedValue(0);
  const translateY2 = useSharedValue(0);
  const rotate0 = useSharedValue(0);
  const rotate1 = useSharedValue(0);
  const rotate2 = useSharedValue(0);

  const opacities = useMemo(() => [opacity0, opacity1, opacity2], [opacity0, opacity1, opacity2]);
  const scales = useMemo(() => [scale0, scale1, scale2], [scale0, scale1, scale2]);
  const translateY = useMemo(
    () => [translateY0, translateY1, translateY2],
    [translateY0, translateY1, translateY2],
  );
  const rotations = useMemo(() => [rotate0, rotate1, rotate2], [rotate0, rotate1, rotate2]);

  const heartStyle0 = useAnimatedStyle(() => ({
    opacity: opacity0.value,
    transform: [
      { scale: scale0.value },
      { translateY: translateY0.value },
      { rotate: `${rotate0.value}deg` },
    ],
  }));

  const heartStyle1 = useAnimatedStyle(() => ({
    opacity: opacity1.value,
    transform: [
      { scale: scale1.value },
      { translateY: translateY1.value },
      { rotate: `${rotate1.value}deg` },
    ],
  }));

  const heartStyle2 = useAnimatedStyle(() => ({
    opacity: opacity2.value,
    transform: [
      { scale: scale2.value },
      { translateY: translateY2.value },
      { rotate: `${rotate2.value}deg` },
    ],
  }));

  useEffect(() => {
    const previousLives = previousLivesRef.current;

    if (restorationAnimating) {
      previousLivesRef.current = remainingLives;

      // Smooth 10s restore progression while locked.
      for (let i = 0; i < 3; i += 1) {
        cancelAnimation(opacities[i]);
        cancelAnimation(scales[i]);
        cancelAnimation(translateY[i]);
        cancelAnimation(rotations[i]);
        opacities[i].value = 0;
        scales[i].value = 0.25;
        translateY[i].value = 8;
        rotations[i].value = 0;
      }

      const startOffsets = [350, 3350, 6350];
      for (let i = 0; i < 3; i += 1) {
        opacities[i].value = withDelay(startOffsets[i], withTiming(1, { duration: 1200 }));
        scales[i].value = withDelay(
          startOffsets[i],
          withSequence(
            withTiming(1.2, { duration: 1200 }),
            withTiming(1, { duration: 900 }),
          ),
        );
        translateY[i].value = withDelay(
          startOffsets[i],
          withSequence(
            withTiming(-8, { duration: 400 }),
            withTiming(0, { duration: 800 }),
          ),
        );
      }
      return;
    }

    if (remainingLives < previousLives) {
      const lostIndex = previousLives - 1;
      opacities[lostIndex].value = withSequence(
        withTiming(1, { duration: 90 }),
        withTiming(0, { duration: 250 }),
      );
      scales[lostIndex].value = withSequence(
        withTiming(1.9, { duration: 180 }),
        withTiming(2.25, { duration: 200 }),
      );
      translateY[lostIndex].value = withSequence(
        withTiming(-30, { duration: 180 }),
        withTiming(-2, { duration: 180 }),
      );
      rotations[lostIndex].value = withSequence(
        withTiming(24, { duration: 150 }),
        withTiming(-14, { duration: 140 }),
        withTiming(0, { duration: 100 }),
      );
    } else {
      for (let i = 0; i < 3; i += 1) {
        cancelAnimation(opacities[i]);
        cancelAnimation(scales[i]);
        cancelAnimation(translateY[i]);
        cancelAnimation(rotations[i]);

        opacities[i].value = withTiming(i < remainingLives ? 1 : 0, { duration: 140 });
        scales[i].value = withTiming(1, { duration: 140 });
        translateY[i].value = withTiming(0, { duration: 140 });
        rotations[i].value = withTiming(0, { duration: 140 });
      }
    }

    previousLivesRef.current = remainingLives;
  }, [
    opacities,
    remainingLives,
    restorationAnimating,
    rotations,
    scales,
    translateY,
  ]);

  return (
    <View className="rounded-2xl border border-[#c48f57] bg-[#fff4df] px-4 py-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-[#6b3f1f]">Lives</Text>
        <View className="flex-row items-center">
          <Animated.Text
            style={[{ marginHorizontal: 2, fontSize: 24, color: HEART_COLOR }, heartStyle0]}
          >
            {"\u2665"}
          </Animated.Text>
          <Animated.Text
            style={[{ marginHorizontal: 2, fontSize: 24, color: HEART_COLOR }, heartStyle1]}
          >
            {"\u2665"}
          </Animated.Text>
          <Animated.Text
            style={[{ marginHorizontal: 2, fontSize: 24, color: HEART_COLOR }, heartStyle2]}
          >
            {"\u2665"}
          </Animated.Text>
        </View>
      </View>
      {locked && (
        <Text className="mt-2 text-xs font-medium text-[#9a3412]">
          Life restoring in {countdownSeconds}s
        </Text>
      )}
    </View>
  );
}
