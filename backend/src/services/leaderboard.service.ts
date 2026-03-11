import User from "../models/user.model";

export const getLeaderboardService = async () => {
  const players = await User.find({
    gameStartedAt: { $exists: true, $ne: null },
  }).select("username currentLevel penaltyTime gameStartedAt gameCompletedAt").lean();

  const leaderboard = players.map((player) => {
    let time = null;

    if (player.gameCompletedAt && player.gameStartedAt) {
      const baseTime =
        player.gameCompletedAt.getTime() - player.gameStartedAt.getTime();

      time = Math.floor((baseTime + (player.penaltyTime || 0) * 1000) / 1000);
    } else if (player.gameStartedAt) {
      const baseTime = Date.now() - player.gameStartedAt.getTime();

      time = Math.floor((baseTime + (player.penaltyTime || 0) * 1000) / 1000);
    }

    return {
      id: player._id,
      username: player.username,
      currentLevel: player.currentLevel,
      time,
    };
  });

  leaderboard.sort((a, b) => {
    if (b.currentLevel !== a.currentLevel) {
      return b.currentLevel - a.currentLevel;
    }

    if (a.time === null) return 1;
    if (b.time === null) return -1;

    return a.time - b.time;
  });

  return leaderboard.map((player, index) => ({
    rank: index + 1,
    ...player,
  }));
};
