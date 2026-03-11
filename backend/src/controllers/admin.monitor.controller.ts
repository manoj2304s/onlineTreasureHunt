import { Request, Response } from "express";
import User from "../models/user.model";
import { GameConfig } from "../models/gameConfig.model";
import { getRecentActivities } from "../services/activity.service";

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
      .select("username email currentLevel wrongAttempts lockUntil")
      .sort({ currentLevel: -1 });

    const formatted = players.map((p) => ({
      userId: p._id,
      username: p.username,
      email: p.email,
      currentLevel: p.currentLevel,
      wrongAttempts: p.wrongAttempts,
      isLocked: p.lockedUntil && p.lockedUntil > new Date(),
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch players" });
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

