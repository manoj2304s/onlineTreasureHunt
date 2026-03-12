import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { getMe } from "@/src/services/authService";
import {
  getCurrentLevel,
  getHint,
  postSubmitAnswer,
} from "@/src/services/gameplayService";
import { AnswerResultOverlay } from "@/src/components/gameplay/AnswerResultOverlay";
import { LivesPanel } from "@/src/components/gameplay/LivesPanel";
import { InlineBanner } from "@/src/components/ui/InlineBanner";
import { TreasureBackground } from "@/src/components/ui/TreasureBackground";
import { useAppFeedback } from "@/src/hooks/useAppFeedback";
import {
  AnswerState,
  CurrentLevelResponse,
  GameplayPlayerState,
  SubmitAnswerResponse,
} from "@/src/types/gameplay";

const LOCK_ERROR_MSG = "All Lives Lost! Wait for restoration";

const getRemainingSeconds = (lockedUntil: string | null) => {
  if (!lockedUntil) return 0;
  const diff = Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 1000);
  return diff > 0 ? diff : 0;
};

export default function GameplayScreen() {
  const feedback = useAppFeedback();
  const [level, setLevel] = useState<CurrentLevelResponse | null>(null);
  const [answer, setAnswer] = useState("");
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [overlayVariant, setOverlayVariant] = useState<"success" | "restored" | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<GameplayPlayerState>({
    wrongAttempts: 0,
    lockedUntil: null,
  });
  const [displayLives, setDisplayLives] = useState(3);
  const [hintUsedLevels, setHintUsedLevels] = useState<number[]>([]);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [penaltyToastVisible, setPenaltyToastVisible] = useState(false);
  const [restorationAnimating, setRestorationAnimating] = useState(false);
  const [hintRequestInFlight, setHintRequestInFlight] = useState(false);
  const [hintModalVisible, setHintModalVisible] = useState(false);
  const [hintConfirmVisible, setHintConfirmVisible] = useState(false);
  const [hintText, setHintText] = useState("");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const wasLockedRef = useRef(false);
  const inputShake = useSharedValue(0);
  const penaltyToastTranslateY = useSharedValue(0);
  const penaltyToastOpacity = useSharedValue(0);

  const remainingLives = useMemo(() => Math.max(0, displayLives), [displayLives]);
  const isLocked = countdownSeconds > 0;
  const submissionBlocked = isLocked || restorationAnimating;
  const isHintUsedForCurrentLevel = useMemo(() => {
    const levelNumber = level?.levelNumber;
    if (!levelNumber) return false;
    return hintUsedLevels.includes(levelNumber);
  }, [hintUsedLevels, level?.levelNumber]);

  const runTimer = (cb: () => void, ms: number) => {
    const t = setTimeout(cb, ms);
    timersRef.current.push(t);
  };

  useEffect(
    () => () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    },
    [],
  );

  const fetchPlayerState = useCallback(async () => {
    const me = await getMe();
    const wrongAttempts = me.wrongAttempts ?? 0;
    const lockedUntil = me.lockedUntil ?? null;
    setHintUsedLevels(Array.isArray(me.hintUsedLevels) ? me.hintUsedLevels : []);
    setPlayerState({ wrongAttempts, lockedUntil });
    setCountdownSeconds(getRemainingSeconds(lockedUntil));

    const locked = getRemainingSeconds(lockedUntil) > 0;
    if (locked) {
      setDisplayLives(0);
      return;
    }

    setDisplayLives(Math.max(0, 3 - wrongAttempts));
  }, []);

  const fetchLevel = useCallback(async () => {
    setScreenError(null);
    try {
      const res = await getCurrentLevel();
      setLevel(res);
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 404) {
        router.replace("/completed");
        return;
      }

      if (status === 403 && data?.locationLocked) {
        router.replace("/location");
        return;
      }

      setScreenError(data?.message || "Failed to load level");
    }
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      await Promise.all([fetchLevel(), fetchPlayerState()]);
    } catch {
      setScreenError("Failed to load gameplay state");
    } finally {
      setLoading(false);
    }
  }, [fetchLevel, fetchPlayerState]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (isLocked) {
      wasLockedRef.current = true;
      if (!restorationAnimating) {
        setRestorationAnimating(true);
      }
      return;
    }

    if (wasLockedRef.current) {
      wasLockedRef.current = false;
      setRestorationAnimating(false);
      setDisplayLives(3);
      setAnswerState("idle");
      feedback.showSuccess("All lives restored.");
    }
  }, [feedback, isLocked, restorationAnimating]);

  useEffect(() => {
    if (!playerState.lockedUntil) return;

    const timer = setInterval(() => {
      setCountdownSeconds(getRemainingSeconds(playerState.lockedUntil));
    }, 1000);

    return () => clearInterval(timer);
  }, [playerState.lockedUntil]);

  const inputShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: inputShake.value }],
  }));
  const penaltyToastStyle = useAnimatedStyle(() => ({
    opacity: penaltyToastOpacity.value,
    transform: [{ translateY: penaltyToastTranslateY.value }],
  }));

  const playWrongAnswerAnimation = () => {
    inputShake.value = withSequence(
      withTiming(-10, { duration: 55, easing: Easing.linear }),
      withTiming(10, { duration: 55, easing: Easing.linear }),
      withTiming(-8, { duration: 55, easing: Easing.linear }),
      withTiming(8, { duration: 55, easing: Easing.linear }),
      withTiming(0, { duration: 55, easing: Easing.linear }),
    );
  };

  const showPenaltyToast = () => {
    setPenaltyToastVisible(true);
    penaltyToastTranslateY.value = 0;
    penaltyToastOpacity.value = 1;

    penaltyToastTranslateY.value = withTiming(-230, {
      duration: 3000,
      easing: Easing.out(Easing.cubic),
    });
    penaltyToastOpacity.value = withTiming(0, {
      duration: 3000,
      easing: Easing.out(Easing.quad),
    });

    runTimer(() => setPenaltyToastVisible(false), 3100);
  };

  const handleSubmitResponse = async (res: SubmitAnswerResponse) => {
    if ("gameCompleted" in res && res.gameCompleted) {
      setOverlayVariant("success");
      setAnswerState("success");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
      runTimer(() => router.replace("/completed"), 850);
      return;
    }

    if ("correct" in res && res.correct === false) {
      setAnswerState("wrong");
      setDisplayLives((prev) => Math.max(0, prev - 1));
      playWrongAnswerAnimation();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => undefined,
      );
      setAnswer("");
      if ((res.message || "").includes("3 wrong attempts")) {
        showPenaltyToast();
        setAnswerState("locked");
        await fetchPlayerState();
      } else {
        await fetchPlayerState();
        setAnswerState("idle");
      }
      return;
    }

    if ("correct" in res && res.correct) {
      setOverlayVariant("success");
      setAnswerState("success");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
      setAnswer("");
      runTimer(() => {
        setOverlayVariant(null);
        router.replace("/location");
      }, 820);
    }
  };

  const submitAnswer = async () => {
    const normalized = answer.trim();

    if (!normalized) {
      playWrongAnswerAnimation();
      feedback.showWarning("Enter an answer before submitting.", {
        placement: "center",
        duration: 1500,
        animationType: "zoom-in",
      });
      return;
    }

    if (submissionBlocked) {
      setAnswerState("locked");
      feedback.showWarning(
        restorationAnimating
          ? "Restoring lives..."
          : `Wait ${countdownSeconds}s before retrying.`,
      );
      return;
    }

    if (answerState === "submitting") {
      return;
    }

    setAnswerState("submitting");

    try {
      const res = await postSubmitAnswer(normalized);
      await handleSubmitResponse(res);
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 403 && data?.locationLocked) {
        router.replace("/location");
        return;
      }

      if (status === 403 && data?.message === LOCK_ERROR_MSG) {
        await fetchPlayerState();
        setAnswerState("locked");
        feedback.showWarning(data?.message);
        return;
      }

      if (status === 404) {
        router.replace("/completed");
        return;
      }

      setAnswerState("wrong");
      playWrongAnswerAnimation();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => undefined,
      );
      setAnswerState("idle");
    } finally {
      if (answerState !== "success") {
        runTimer(() => {
          setAnswerState((prev) => (prev === "submitting" ? "idle" : prev));
        }, 50);
      }
    }
  };

  const continueHintRequest = async () => {
    setHintRequestInFlight(true);
    try {
      const res = await getHint();
      const openHintModal = () => {
        setHintText(res.hint);
        setHintModalVisible(true);
      };

      if (res.penaltyApplied) {
        if (level?.levelNumber) {
          setHintUsedLevels((prev) =>
            prev.includes(level.levelNumber) ? prev : [...prev, level.levelNumber],
          );
        }
        feedback.showWarning("+5 minutes added.", {
          duration: 2000,
          placement: "center",
          animationType: "zoom-in",
          style: { backgroundColor: "#c26b1b", borderRadius: 12 },
          textStyle: { color: "white", fontWeight: "700" },
        });
        runTimer(openHintModal, 2000);
      } else {
        openHintModal();
      }
    } catch (err: any) {
      feedback.showError(err.response?.data?.message || "Cannot get hint.");
    } finally {
      setHintRequestInFlight(false);
    }
  };

  const requestHint = async () => {
    if (hintRequestInFlight) return;
    if (isHintUsedForCurrentLevel) {
      await continueHintRequest();
      return;
    }
    setHintConfirmVisible(true);
  };

  if (loading) {
    return (
      <TreasureBackground className="flex-row justify-center items-center">
        <Text className="text-base font-semibold text-[#6b3f1f]">
          Loading level...
        </Text>
      </TreasureBackground>
    );
  }

  if (screenError) {
    return (
      <TreasureBackground className="flex-row justify-center items-center px-6">
        <InlineBanner message={screenError} tone="error" />
        <TouchableOpacity
          onPress={bootstrap}
          className="mt-4 rounded-xl bg-[#7a4a24] px-6 py-3"
        >
          <Text className="font-semibold text-white">Retry</Text>
        </TouchableOpacity>
      </TreasureBackground>
    );
  }

  return (
    <TreasureBackground>
      <View className="flex-1 px-5 pb-8 pt-14">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-3xl font-black text-[#6b3f1f]">
            Level {level?.levelNumber}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/leaderboard")}
            className="rounded-xl bg-[#7a4a24] px-3 py-2"
          >
            <Text className="text-xs font-bold text-white">Leaderboard</Text>
          </TouchableOpacity>
        </View>

        <LivesPanel
          remainingLives={remainingLives}
          countdownSeconds={countdownSeconds}
          locked={isLocked}
          restorationAnimating={restorationAnimating}
        />

        <View className="mt-4 rounded-2xl border border-[#c48f57] bg-[#fff7e9] p-5">
          <Text className="text-lg font-semibold text-[#5b3218]">
            {level?.question}
          </Text>
        </View>

        <Animated.View style={inputShakeStyle} className="mt-4">
          <TextInput
            placeholder="Type your answer"
            placeholderTextColor="#9a7a55"
            editable={!submissionBlocked}
            value={answer}
            onChangeText={setAnswer}
            className="rounded-2xl border border-[#c48f57] bg-[#fffdf6] p-4 text-[#5b3218]"
          />
        </Animated.View>

        <TouchableOpacity
          onPress={submitAnswer}
          disabled={answerState === "submitting" || submissionBlocked}
          className={`mt-4 rounded-2xl p-4 ${
            answerState === "submitting" || submissionBlocked
              ? "bg-[#c49a73]"
              : "bg-[#7a4a24]"
          }`}
        >
          <Text className="text-center text-base font-bold text-white">
            {submissionBlocked
              ? restorationAnimating
                ? "Restoring lives..."
                : `Locked (${countdownSeconds}s)`
              : answerState === "submitting"
                ? "Checking..."
                : "Submit Answer"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={requestHint}
          disabled={hintRequestInFlight}
          className="mt-3 rounded-2xl border border-[#c48f57] bg-[#f7d08a] p-4"
        >
          <Text className="text-center text-base font-bold text-[#5b3218]">
            {hintRequestInFlight ? "Loading Hint..." : "Get Hint (-Penalty)"}
          </Text>
        </TouchableOpacity>
      </View>

      {penaltyToastVisible && (
        <Animated.View
          style={penaltyToastStyle}
          className="absolute left-0 right-0 top-1/2 items-center"
          pointerEvents="none"
        >
          <View className="flex-row items-center rounded-2xl bg-[#1f2937] px-5 py-3">
            <Text className="text-center text-base font-black text-white">
              +2 minutes penalty
            </Text>
          </View>
        </Animated.View>
      )}

      {hintModalVisible && (
        <Animated.View
          entering={FadeIn.duration(120)}
          exiting={FadeOut.duration(140)}
          className="absolute inset-0 items-center justify-center bg-black/45 px-6"
        >
          <View className="w-full max-w-[420px] rounded-3xl border border-[#d8a76f] bg-[#fff7e9] p-5">
            <TouchableOpacity
              onPress={() => setHintModalVisible(false)}
              className="absolute right-3 top-3 z-10 p-1"
            >
              <Text className="text-2xl font-bold text-[#7a4a24]">×</Text>
            </TouchableOpacity>

            <Text className="text-center text-2xl font-black text-[#5b3218]">
              Hint
            </Text>
            <Text className="mt-3 text-center text-base font-semibold text-[#7a4a24]">
              {hintText}
            </Text>
          </View>
        </Animated.View>
      )}

      {hintConfirmVisible && (
        <Animated.View
          entering={FadeIn.duration(120)}
          exiting={FadeOut.duration(120)}
          className="absolute inset-0 items-center justify-center bg-black/45 px-6"
        >
          <View className="w-full max-w-[420px] rounded-3xl border border-[#d8a76f] bg-[#fff7e9] p-5">
            <Text className="text-center text-2xl font-black text-[#5b3218]">
              Use Hint?
            </Text>
            <Text className="mt-6 text-center text-base font-semibold text-[#7a4a24]">
              +5 minutes penalty
            </Text>

            <View className="mt-5 flex-row gap-3">
              <TouchableOpacity
                onPress={() => setHintConfirmVisible(false)}
                className="flex-1 rounded-xl border border-[#7a4a24] px-4 py-3"
              >
                <Text className="text-center font-semibold text-[#7a4a24]">
                  Discard
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={hintRequestInFlight}
                onPress={async () => {
                  setHintConfirmVisible(false);
                  await continueHintRequest();
                }}
                className={`flex-1 rounded-xl px-4 py-3 ${
                  hintRequestInFlight ? "bg-[#c49a73]" : "bg-[#7a4a24]"
                }`}
              >
                <Text className="text-center font-semibold text-white">
                  Continue
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      <AnswerResultOverlay
        variant={overlayVariant}
        onClose={() => setOverlayVariant(null)}
      />
    </TreasureBackground>
  );
}
