import { Request, Response } from "express";
import User from "../models/user.model";

export const unlockPlayer = async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;

    const player = await User.findById(playerId);

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    player.locationUnlocked = true;
    player.lockedUntil = null;
    player.wrongAttempts = 0;

    await player.save();

    res.json({ message: "Player unlocked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPlayer = async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;

    const player = await User.findById(playerId);

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    player.currentLevel = 1;
    player.wrongAttempts = 0;
    player.penaltyTime = 0;
    player.hintUsedLevels = [];
    player.gameStartedAt = null;
    player.gameCompletedAt = null;
    player.locationUnlocked = false;
    player.lockedUntil = null;

    await player.save();

    res.json({ message: "Player progress reset" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const advancePlayer = async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;

    const player = await User.findById(playerId);

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    player.currentLevel += 1;

    await player.save();

    res.json({ message: "Player advanced to next level" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

