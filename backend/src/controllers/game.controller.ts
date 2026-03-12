import { Request, Response } from "express";
import Level from "../models/level.model";
import { GameConfig } from "../models/gameConfig.model";
import bcrypt from "bcrypt";
import { io } from "../index";
import { getLeaderboardService } from "../services/leaderboard.service";
import { createActivity } from "../services/activity.service";

// Fisher–Yates Shuffle Algorithm
const shuffleNumbers = (numbers: number[]) => {
  const shuffled = [...numbers];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1)); // Random index generated
    const current = shuffled[i]; // Perform swap for for-loop and generated index
    shuffled[i] = shuffled[j] as number;
    shuffled[j] = current as number;
  }
  return shuffled;
};

// Validation of shuffle and levelNumber array
const isValidLevelOrder = (order: number[], levelNumbers: number[]) => {
  // Checks the length
  if (order.length !== levelNumbers.length) {
    return false;
  }
  // Checks for any duplicates
  const orderSet = new Set(order);
  if (orderSet.size !== levelNumbers.length) {
    return false;
  }
  // Return true if every element present in one other
  return levelNumbers.every((levelNumber) => orderSet.has(levelNumber));
};

const createInitialLevelOrder = (
  levelNumbers: number[],
  currentLevelIndex: number,
  currentLevelNumber: number | null,
) => {
  if (
    currentLevelNumber !== null &&
    currentLevelIndex >= 1 &&
    currentLevelIndex <= levelNumbers.length
  ) {
    // Remove current level then shuffleNumbers
    const remaining = shuffleNumbers(
      levelNumbers.filter((levelNumber) => levelNumber !== currentLevelNumber),
    );
    // Insert current level at correct position
    remaining.splice(currentLevelIndex - 1, 0, currentLevelNumber);
    return remaining;
  }

  return shuffleNumbers(levelNumbers);
};

const ensureUserLevelOrder = async (user: any) => {
  // Fetch levels numbers from DB
  const levels = await Level.find().select("levelNumber -_id").lean();
  // Sorting level numbers (asc)
  const levelNumbers = levels
    .map((level) => level.levelNumber)
    .sort((a, b) => a - b);
  // Check for levels present in DB
  if (levelNumbers.length === 0) {
    return [];
  }
  // Check if user level order is present
  const existingOrder = Array.isArray(user.levelOrder) ? user.levelOrder : [];
  
  if (isValidLevelOrder(existingOrder, levelNumbers)) {
    return existingOrder;
  }
  // user current level
  const currentLevelIndex =
    typeof user.currentLevel === "number" && user.currentLevel > 0
      ? user.currentLevel
      : 1;
  // check user current level exists
  const currentLevelNumber = levelNumbers.includes(user.currentLevel)
    ? user.currentLevel
    : null;
  
  user.levelOrder = createInitialLevelOrder(
    levelNumbers,
    currentLevelIndex,
    currentLevelNumber,
  );
  await user.save();

  return user.levelOrder;
};

// Helper to traverse through levelOrder array
const getMappedLevelNumber = (user: any, levelOrder: number[]) => {
  const currentLevelIndex = user.currentLevel - 1;

  if (currentLevelIndex < 0 || currentLevelIndex >= levelOrder.length) {
    return null;
  }

  return levelOrder[currentLevelIndex];
};

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

    const config = await GameConfig.findById("game-config");
    if (!config || config.status !== "active") {
      return res.status(403).json({
        message: "Game is not currently active",
        status: "inactive",
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
        locationLocked: true,
      });
    }

    const { answer } = req.body;

    if (!answer || !answer.trim()) {
      return res.status(400).json({
        message: "Answer is required",
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

    const isCorrect = await bcrypt.compare(
      answer.toLowerCase().trim(),
      level.answerHash,
    );

    if (!isCorrect) {
      user.wrongAttempts = (user.wrongAttempts || 0) + 1;

      if (user.wrongAttempts >= 3) {
        user.penaltyTime += 120;
        user.lockedUntil = new Date(Date.now() + 10000);
        user.wrongAttempts = 0;

        await user.save();

        const leaderboard = await getLeaderboardService();
        io.emit("leaderboard:update", leaderboard);

        await createActivity(
          "LOST_LIFE",
          `${user.username} lost all lives at level ${level.levelNumber}`,
          user.username,
          level.levelNumber,
        );

        io.emit("activity:update", {
          message: `${user.username} lost all lives at level ${level.levelNumber}`,
        });

        return res.json({
          correct: false,
          message:
            "3 wrong attempts. 2 minute penalty applied. Try again in 10 seconds.",
          WrongAttempts: user.wrongAttempts,
        });
      }

      await user.save();

      await createActivity(
        "INCORRECT_ANSWER",
        `${user.username} provided an incorrect answer for level ${level.levelNumber}`,
        user.username,
        level.levelNumber,
      );

      io.emit("activity:update", {
        message: `${user.username} provided an incorrect answer for level ${level.levelNumber}`,
      });

      return res.json({
        correct: false,
        message: "Incorrect answer",
      });
    }

    user.currentLevel += 1;
    user.locationUnlocked = false;
    user.wrongAttempts = 0;

    const nextMappedLevelNumber = getMappedLevelNumber(user, levelOrder);
    const nextLevel = nextMappedLevelNumber
      ? await Level.findOne({
          levelNumber: nextMappedLevelNumber,
        })
      : null;

    if (!nextLevel) {
      user.gameCompletedAt = new Date();
      await createActivity(
        "COMPLETED_LEVEL",
        `${user.username} Completed game`,
        user.username,
      );

      io.emit("activity:update", {
        message: `${user.username} completed the game`,
      });
    }

    await user.save();

    const leaderboard = await getLeaderboardService();
    io.emit("leaderboard:update", leaderboard);

    if (!nextLevel) {
      return res.json({
        gameCompleted: true,
        message: "Congratulations! You completed the treasure hunt!",
      });
    }

    await createActivity(
      "LEVEL_COMPLETED",
      `${user.username} completed level ${level.levelNumber}`,
      user.username,
      level.levelNumber,
    );

    io.emit("activity:update", {
      message: `${user.username} completed level ${level.levelNumber}`,
    });

    io.emit("player:update", {
      userId: user._id,
      username: user.username,
      currentLevel: user.currentLevel,
      wrongAttempts: user.wrongAttempts,
      gameCompletedAt: user.gameCompletedAt,
    });

    return res.json({
      correct: true,
      levelNumber: nextLevel.levelNumber,
      question: nextLevel.question,
      hint: nextLevel.hint,
    });
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

    io.emit("activity:update", {
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

    if (!qrCode) {
      return res.status(400).json({
        message: "QR code is required",
      });
    }

    const config = await GameConfig.findById("game-config");

    if (!config || config.status !== "active") {
      return res.status(403).json({
        message: "Game is not currently active",
        status: "inactive",
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
    console.log("Expected QR Code:", level);
    if (qrCode !== level.qrCode) {
      return res.status(400).json({
        message: "Invalid QR code",
      });
    }

    user.locationUnlocked = true;
    await user.save();

    await createActivity(
      "LOCATION_UNLOCKED",
      `${user.username} unlocked location for level ${level.levelNumber}`,
      user.username,
      level.levelNumber,
    );

    io.emit("activity:update", {
      message: `${user.username} unlocked location for level ${level.levelNumber}`,
    });

    res.json({
      message: "Location verified. Question unlocked.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to unlock location",
    });
  }
};
