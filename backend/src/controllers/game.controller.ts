import { Request, Response } from "express";
import Level from "../models/level.model";
import { GameConfig } from "../models/gameConfig.model";
import { emitSocket } from "../realtime/socket";
import { getLeaderboardService } from "../services/leaderboard.service";
import { createActivity } from "../services/activity.service";
import {
  ensureUserLevelOrder,
  getMappedLevelNumber,
} from "../services/levelOrder.service";
import {
  submitAnswerService,
  unlockLocationService,
} from "../services/gameplay.service";

export const getCurrentLevel = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const config = await GameConfig.findById("game-config");

    if (!config || config.status !== "active") {
      return res.status(403).json({
        message: "Game is not currently active",
        status: "inactive",
      });
    }

    const levelOrder = await ensureUserLevelOrder(user);
    const mappedLevelNumber = getMappedLevelNumber(user, levelOrder);
    if (!mappedLevelNumber) {
      return res.status(404).json({ message: "Current level not found" });
    }

    const level = await Level.findOne({
      levelNumber: mappedLevelNumber,
    });
    if (!level) {
      return res.status(404).json({ message: "Current level not found" });
    }

    res.status(200).json({
      levelNumber: user.currentLevel,
      question: level.question,
      hint: level.hint,
      location: level.location,
    });
  } catch (error) {
    console.error("Error fetching current level:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const submitAnswer = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { answer } = req.body;

    const result = await submitAnswerService(user, answer);
    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return res.status(500).json({
      message: `Server error ${error}`,
    });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const leaderboard = await getLeaderboardService();

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch leaderboard",
    });
  }
};

export const getHint = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const config = await GameConfig.findById("game-config");
    if (!config || config.status !== "active") {
      return res.status(403).json({
        message: "Game is not currently active",
        status: "inactive",
      });
    }

    const levelOrder = await ensureUserLevelOrder(user);
    const mappedLevelNumber = getMappedLevelNumber(user, levelOrder);
    if (!mappedLevelNumber) {
      return res.status(404).json({
        message: "Level not found",
      });
    }

    const level = await Level.findOne({
      levelNumber: mappedLevelNumber,
    });
    if (!level) {
      return res.status(404).json({
        message: "Level not found",
      });
    }

    if (!level.hint) {
      return res.status(404).json({
        message: "Hint not available for this level",
      });
    }

    let penaltyApplied = false;
    const hintAlreadyUsed = user.hintUsedLevels.includes(level.levelNumber);
    if (!hintAlreadyUsed) {
      user.penaltyTime += 300;
      user.hintUsedLevels.push(level.levelNumber);
      penaltyApplied = true;
      await user.save();
    }

    await createActivity(
      "HINT_REQUESTED",
      `${user.username} requested a hint for level ${level.levelNumber}`,
      user.username,
      level.levelNumber,
    );

    emitSocket("activity:update", {
      message: `${user.username} requested a hint for level ${level.levelNumber}`,
    });

    res.json({
      hint: level.hint,
      penaltyApplied,
    });
  } catch (error) {
    res.status(500).json({
      message: `Server error ${error}`,
    });
  }
};

export const unlockLocation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { qrCode } = req.body;
    const result = await unlockLocationService(user, qrCode);
    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    res.status(500).json({
      message: "Failed to unlock location",
    });
  }
};
