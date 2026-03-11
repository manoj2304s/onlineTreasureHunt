export type Player = {
  userId: string;
  username: string;
  currentLevel: number;
  wrongAttempts: number;
  gameStartedAt?: string;
  gameCompletedAt?: string;
};
