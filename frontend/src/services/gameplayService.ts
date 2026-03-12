import API from "../api/axios";
import {
  CurrentLevelResponse,
  HintResponse,
  LeaderboardEntry,
  SubmitAnswerResponse,
  UnlockLocationResponse,
} from "../types/gameplay";

export const getCurrentLevel = async () => {
  const res = await API.get<CurrentLevelResponse>("/gameplay/current-level");
  return res.data;
};

export const postSubmitAnswer = async (answer: string) => {
  const res = await API.post<SubmitAnswerResponse>("/gameplay/submit-answer", {
    answer,
  });
  return res.data;
};

export const getLeaderboard = async () => {
  const res = await API.get<LeaderboardEntry[]>("/gameplay/leaderboard");
  return res.data;
};

export const getHint = async () => {
  const res = await API.get<HintResponse>("/gameplay/hint");
  return res.data;
};

export const unlockLocation = async (qrCode: string) => {
  const res = await API.post<UnlockLocationResponse>("/gameplay/unlock-location", {
    qrCode,
  });
  return res.data;
};
