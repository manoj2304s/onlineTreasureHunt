import { Request, Response } from "express";
import Level from "../models/level.model";
import bcrypt from "bcrypt";
import User from "../models/user.model";

export const getCurrentLevel = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentLevel = await Level.findOne({
      levelNumber: user.currentLevel,
    });
    if (!currentLevel) {
      return res.status(404).json({ message: "Current level not found" });
    }

    res.status(200).json({
      levelNumber: currentLevel.levelNumber,
      description: currentLevel.question,
      hint: currentLevel.hint,
    });
  } catch (error) {
    console.error("Error fetching current level:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const submitAnswer = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user.gameStartedAt) {
      user.gameStartedAt = new Date();
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({
        message: "All Lives Lost! Wait for restoration",
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
    user.wrongAttempts = 0;
    await user.save();

    const nextLevel = await Level.findOne({
      levelNumber: user.currentLevel,
    });
    if (!nextLevel) {
      user.gameCompletedAt = new Date();
      await user.save();

      return res.json({
        correct: true,
        message: "Congratulations! You completed the treasure hunt!",
      });
    }

    res.json({
      correct: true,
      nextLevel: nextLevel.levelNumber,
      question: nextLevel.question,
      hint: nextLevel.hint,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const users = await User.find()
      .select("username currentLevel")
      .sort({ currentLevel: -1, gameCompletedAt: 1 })
      .limit(10);

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      name: user.username,
      level: user.currentLevel,
    }));

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

    const level = await Level.findOne({
      levelNumber: user.currentLevel,
    });
    if (!level) {
      return res.status(404).json({
        message: "Level not found",
      });
    }

    const alreadyUsed = user.hintUsedLevels.includes(level.levelNumber);
    if (!alreadyUsed) {
      user.penaltyTime += 300;
      user.hintUsedLevels.push(level.levelNumber);
      await user.save();
    }

    res.json({
      hint: level.hint,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};
