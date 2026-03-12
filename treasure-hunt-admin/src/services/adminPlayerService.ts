import API from "./api";
import { Player, PlayerDetails } from "@/src/types";

export const getPlayers = async () => {
  const res = await API.get<Player[]>("/admin/players");
  return res.data;
};

export const getPlayerDetails = async (playerId: string) => {
  const res = await API.get<PlayerDetails>(`/admin/players/${playerId}`);
  return res.data;
};

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
