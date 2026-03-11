import API from "./api";

export const getLeaderboard = async () => {
  const res = await API.get("/gameplay/leaderboard");
  return res.data;
};
