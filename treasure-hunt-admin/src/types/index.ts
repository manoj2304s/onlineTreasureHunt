export type Player = {
  userId: string;
  username: string;
  currentLevel: number;
  wrongAttempts: number;
  gameStartedAt?: string;
  gameCompletedAt?: string;
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