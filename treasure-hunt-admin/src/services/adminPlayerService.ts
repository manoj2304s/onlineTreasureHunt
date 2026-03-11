import API from "./api";

export const unlockPlayer = async (playerId: string) => {
  const res = await API.post(`/admin/player/unlock/${playerId}`);
  return res.data;
};

export const advancePlayer = async (playerId: string) => {
  const res = await API.post(`/admin/player/advance/${playerId}`);
  return res.data;
};

export const resetPlayer = async (playerId: string) => {
  const res = await API.post(`/admin/player/reset/${playerId}`);
  return res.data;
};
