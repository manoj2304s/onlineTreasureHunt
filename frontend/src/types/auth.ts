export type AuthMeResponse = {
  _id: string;
  username: string;
  email: string;
  currentLevel: number;
  gameStartedAt?: string | null;
  gameCompletedAt?: string | null;
  wrongAttempts?: number;
  lockedUntil?: string | null;
  locationUnlocked: boolean;
  penaltyTime?: number;
  hintUsedLevels?: number[];
};
