import { useCallback, useMemo } from "react";
import { useToast } from "react-native-toast-notifications";
import { TextStyle, ViewStyle } from "react-native";

type FeedbackKind = "success" | "danger" | "warning" | "normal";
type FeedbackPlacement = "top" | "bottom" | "center";

type FeedbackOptions = {
  duration?: number;
  placement?: FeedbackPlacement;
  style?: ViewStyle;
  textStyle?: TextStyle;
  animationType?: "slide-in" | "zoom-in";
};

export const useAppFeedback = () => {
  const toast = useToast();

  const show = useCallback(
    (
      message: string,
      type: FeedbackKind = "normal",
      options?: FeedbackOptions,
    ) => {
      toast.show(message, {
        type,
        placement: options?.placement ?? "top",
        duration: options?.duration ?? 2400,
        animationType: options?.animationType ?? "slide-in",
        style: options?.style,
        textStyle: options?.textStyle,
      });
    },
    [toast],
  );

  return useMemo(
    () => ({
      showSuccess: (message: string, options?: FeedbackOptions) =>
        show(message, "success", options),
      showError: (message: string, options?: FeedbackOptions) =>
        show(message, "danger", options),
      showWarning: (message: string, options?: FeedbackOptions) =>
        show(message, "warning", options),
      showInfo: (message: string, options?: FeedbackOptions) =>
        show(message, "normal", options),
    }),
    [show],
  );
};
