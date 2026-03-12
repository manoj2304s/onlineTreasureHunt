export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const DEFAULT_LEADERBOARD_POLL_MS = 5000;
const MIN_LEADERBOARD_POLL_MS = 2000;

const parsePollMs = (value: string | undefined) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LEADERBOARD_POLL_MS;
  }
  return Math.max(MIN_LEADERBOARD_POLL_MS, Math.floor(parsed));
};

export const LEADERBOARD_POLL_MS = parsePollMs(
  process.env.EXPO_PUBLIC_LEADERBOARD_POLL_MS,
);
