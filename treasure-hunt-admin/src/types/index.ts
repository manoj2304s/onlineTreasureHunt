export type Player = {
  userId: string;
  username: string;
  email: string;
  currentLevel: number;
  wrongAttempts: number;
  penaltyTime: number;
  playingTime: number;
  totalTime: number;
  gameStartedAt?: string | null;
  gameCompletedAt?: string | null;
  isLocked?: boolean;
};

export type PlayerDetails = {
  userId: string;
  _id: string;
  username: string;
  email: string;
  currentLevel: number;
  levelOrder: number[];
  gameStartedAt?: string | null;
  gameCompletedAt?: string | null;
  wrongAttempts: number;
  penaltyTime: number;
  hintUsedLevels: number[];
  role: "player" | "admin";
  locationUnlocked: boolean;
  playingTime: number;
  totalTime: number;
};

export type Level = {
  _id: string;
  levelNumber: number;
  question: string;
  answer?: string;
  hint?: string;
  qrCode: string;
  location: {
    latitude: number;
    longitude: number;
  };
};
