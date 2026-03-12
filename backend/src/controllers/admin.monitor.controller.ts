import { Request, Response } from "express";
import User from "../models/user.model";
import { GameConfig } from "../models/gameConfig.model";
import { getRecentActivities } from "../services/activity.service";

const toSeconds = (start?: Date | null, end?: Date | null) => {
  if (!start) {
    return 0;
  }

  const endAt = end ?? new Date();
  return Math.max(0, Math.floor((endAt.getTime() - start.getTime()) / 1000));
};

export const getGameStats = async (req: Request, res: Response) => {
  try {
    const totalPlayers = await User.countDocuments();

    const playersStarted = await User.countDocuments({
      gameStartedAt: { $ne: null },
    });

    const playersCompleted = await User.countDocuments({
      gameCompletedAt: { $ne: null },
    });

    const config = await GameConfig.findById("game-config");

    const levels = await User.find().select("currentLevel");

    const maxLevel = Math.max(...levels.map((u) => u.currentLevel || 1));

    res.json({
      totalPlayers,
      playersStarted,
      playersCompleted,
      mostReachedLevel: maxLevel,
      gameStatus: config?.status,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch game stats" });
  }
};

export const getPlayerProgress = async (req: Request, res: Response) => {
  try {
    const players = await User.find()
      .select(
        "username email currentLevel wrongAttempts lockedUntil penaltyTime gameStartedAt gameCompletedAt",
      )
      .sort({ currentLevel: -1 });

    const formatted = players.map((p) => ({
      userId: p._id,
      username: p.username,
      email: p.email,
      currentLevel: p.currentLevel,
      wrongAttempts: p.wrongAttempts,
      penaltyTime: p.penaltyTime ?? 0,
      gameStartedAt: p.gameStartedAt,
      gameCompletedAt: p.gameCompletedAt,
      playingTime: toSeconds(p.gameStartedAt, p.gameCompletedAt),
      totalTime: toSeconds(p.gameStartedAt, p.gameCompletedAt) + (p.penaltyTime ?? 0),
      isLocked: p.lockedUntil && p.lockedUntil > new Date(),
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch players" });
  }
};

export const getPlayerDetails = async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;

    const player = await User.findById(playerId).select(
      "-password -createdAt -updatedAt -lockedUntil -__v",
    );

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    const playingTime = toSeconds(player.gameStartedAt, player.gameCompletedAt);
    const penaltyTime = player.penaltyTime ?? 0;

    res.json({
      ...player.toObject(),
      userId: player._id,
      playingTime,
      totalTime: playingTime + penaltyTime,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch player details" });
  }
};

export const getLevelAnalytics = async (req: Request, res: Response) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: "$currentLevel",
          players: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch level stats" });
  }
};

export const getActivities = async (req: Request, res: Response) => {
  try {
    const activities = await getRecentActivities();
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch activities" });
  } 
};

