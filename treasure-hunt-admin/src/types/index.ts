export type Player = {
  _id: string;
  username: string;
  currentLevel: number;
  wrongAttempts: number;
  gameStartedAt?: string;
  gameCompletedAt?: string;
};
