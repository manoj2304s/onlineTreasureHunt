import API from "../api/axios";

export const getCurrentLevel = async () => {
  const res = await API.get("/gameplay/current-level");
  return res.data;
};

export const postSubmitAnswer = async (answer: string) => {
  const res = await API.post("/gameplay/submit-answer", { answer });
  return res.data;
};

export const getLeaderboard = async () => {
  const res = await API.get("/gameplay/leaderboard");
  return res.data;
};

export const getHint = async () => {
  const res = await API.get("/gameplay/hint");
  return res.data;
};

export const unlockLocation = async (qrCode: string) => {
  const res = await API.post("/gameplay/unlock-location", { qrCode });
  return res.data;
};
