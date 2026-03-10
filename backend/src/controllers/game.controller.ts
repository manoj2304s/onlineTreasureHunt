import { Request, Response } from "express";
import Level from "../models/level.model";
import { GameConfig } from "../models/gameConfig.model";
import bcrypt from "bcrypt";
import User from "../models/user.model";

export const getCurrentLevel = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const config = await GameConfig.findById("game-config");

    if (!config || config.status !== "active") {
      return res.status(403).json({
        message: "Game is not currently active",
      });
    }

    const level = await Level.findOne({
      levelNumber: user.currentLevel,
    });
    if (!level) {
      return res.status(404).json({ message: "Current level not found" });
    }

    res.status(200).json({
      levelNumber: level.levelNumber,
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
    const config = await GameConfig.findById("game-config");
    if (!config || config.status !== "active") {
      return res.status(403).json({
        message: "Game is not currently active",
      });
    }

    if (!user.gameStartedAt) {
      user.gameStartedAt = new Date();
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({
        message: "All Lives Lost! Wait for restoration",
      });
    }

    if (!user.locationUnlocked) {
      return res.status(403).json({
        message: "Scan the location QR before answering",
      });
    }

    const { answer } = req.body;
    if (!answer) {
      return res.status(400).json({
        message: "Answer is required",
      });
    }

    const currentLevel = user.currentLevel;
    const level = await Level.findOne({
      levelNumber: currentLevel,
    });
    if (!level) {
      return res.status(404).json({
        message: "Level not found",
      });
    }

    const isCorrect = await bcrypt.compare(
      answer.toLowerCase().trim(),
      level.answerHash,
    );

    if (!isCorrect) {
      user.wrongAttempts += 1;

      if (user.wrongAttempts >= 3) {
        user.penaltyTime += 120;
        user.lockedUntil = new Date(Date.now() + 10000);
        user.wrongAttempts = 0;

        await user.save();

        return res.json({
          correct: false,
          message:
            "3 wrong attempts. 2 minute penalty applied. Try again in 10 seconds.",
        });
      }

      await user.save();

      return res.json({
        correct: false,
        message: "Incorrect answer",
      });
    }

    user.currentLevel += 1;
    user.locationUnlocked = false;
    user.wrongAttempts = 0;
    await user.save();

    const nextLevel = await Level.findOne({
      levelNumber: user.currentLevel,
    });
    if (!nextLevel) {
      user.gameCompletedAt = new Date();
      await user.save();
      return res.json({
        gameCompleted: true,
        message: "Congratulations! You completed the treasure hunt!",
      });
    }

    res.json({
      correct: true,
      levelNumber: nextLevel.levelNumber,
      question: nextLevel.question,
      hint: nextLevel.hint,
    });
  } catch (error) {
    res.status(500).json({
      message: `Server error ${error}`,
    });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const users = await User.find({
      gameCompletedAt: { $ne: null },
    }).select("username gameStartedAt gameCompletedAt penaltyTime");

    const leaderboard = users.map((user) => {
      const baseTime =
        (user.gameCompletedAt?.getTime() ?? 0) -
        (user.gameStartedAt?.getTime() ?? 0);

      const finalTime = baseTime + user.penaltyTime * 1000;

      return {
        username: user.username,
        time: finalTime,
      };
    });

    leaderboard.sort((a, b) => a.time - b.time);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
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
      });
    }

    const level = await Level.findOne({
      levelNumber: user.currentLevel,
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

    if (!qrCode) {
      return res.status(400).json({
        message: "QR code is required",
      });
    }

    const config = await GameConfig.findById("game-config");

    if (!config || config.status !== "active") {
      return res.status(403).json({
        message: "Game is not currently active",
      });
    }

    if (user.gameCompletedAt) {
      return res.status(400).json({
        message: "You have already completed the game",
      });
    }

    if (user.locationUnlocked) {
      return res.status(400).json({
        message: "Location already unlocked",
      });
    }

    const level = await Level.findOne({
      levelNumber: user.currentLevel,
    });

    if (!level) {
      return res.status(404).json({
        message: "Level not found",
      });
    }
    console.log("Expected QR Code:", level);
    if (qrCode !== level.qrCode) {
      return res.status(400).json({
        message: "Invalid QR code",
      });
    }

    user.locationUnlocked = true;
    await user.save();

    res.json({
      message: "Location verified. Question unlocked.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to unlock location",
    });
  }
};
