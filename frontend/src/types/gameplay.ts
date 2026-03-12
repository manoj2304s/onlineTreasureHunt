export type AnswerState = "idle" | "submitting" | "success" | "wrong" | "locked";

export type CurrentLevelResponse = {
  levelNumber: number;
  question: string;
  hint?: string | null;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
};

export type SubmitAnswerSuccessResponse = {
  correct: true;
  levelNumber: number;
  question: string;
  hint?: string | null;
};

export type SubmitAnswerWrongResponse = {
  correct: false;
  message: string;
  locationLocked?: boolean;
  wrongAttempts?: number;
  WrongAttempts?: number;
};

export type SubmitAnswerCompletedResponse = {
  gameCompleted: true;
  message: string;
};

export type SubmitAnswerResponse =
  | SubmitAnswerSuccessResponse
  | SubmitAnswerWrongResponse
  | SubmitAnswerCompletedResponse;

export type UnlockLocationResponse = {
  message: string;
};

export type HintResponse = {
  hint: string;
  penaltyApplied: boolean;
};

export type LeaderboardEntry = {
  id: string;
  username: string;
  currentLevel: number;
  time: number | null;
  rank: number;
};

export type GameplayPlayerState = {
  wrongAttempts: number;
  lockedUntil: string | null;
};

export type LivesState = {
  remainingLives: number;
  lockedUntil: string | null;
  countdownSeconds: number;
};
