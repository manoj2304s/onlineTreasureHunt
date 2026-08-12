import API from "./api";

export const startGame = async (password: string) => {
  const res = await API.post("/admin/gameplay/start", { password });
  return res.data;
};

export const endGame = async (password: string) => {
  const res = await API.post("/admin/gameplay/end", { password });
  return res.data;
};

export const resetGame = async (password: string) => {
  const res = await API.post("/admin/reset-game", { password });
  return res.data;
};

export const getGameStatus = async () => {
  const res = await API.get("/admin/gameplay/status");
  return res.data;
};

export const getActivities = async () => {
  const res = await API.get("/admin/activities");
  return res.data;
};
