import User from "../models/user.model";

export const getLeaderboardService = async () => {
  const players = await User.find().select(
    "username currentLevel penaltyTime gameStartedAt gameCompletedAt",
  );

  const leaderboard = players.map((player) => {
    let time = null;

    if (player.gameCompletedAt && player.gameStartedAt) {
      const baseTime =
        player.gameCompletedAt.getTime() - player.gameStartedAt.getTime();

      time = Math.floor((baseTime + player.penaltyTime * 1000) / 1000);
    } else if (player.gameStartedAt) {
      const baseTime = Date.now() - player.gameStartedAt.getTime();

      time = Math.floor((baseTime + player.penaltyTime * 1000) / 1000);
    }

    return {
      id: player._id,
      username: player.username,
      currentLevel: player.currentLevel,
      time,
    };
  });

  return leaderboard;
};
