import API from "./api";

export const startGame = async () => {
  const res = await API.post("/admin/gameplay/start", {});
  return res.data;
};

export const endGame = async () => {
  const res = await API.post("/admin/gameplay/end", {});
  return res.data;
};

export const resetGame = async () => {
  const res = await API.post("/admin/reset-game", {});
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
