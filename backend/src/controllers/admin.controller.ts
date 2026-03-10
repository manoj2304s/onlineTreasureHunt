import { Response, Request } from "express";
import Level from "../models/level.model";
import User from "../models/user.model";
import { GameConfig } from "../models/gameConfig.model";
import bcrypt from "bcrypt";

export const createLevel = async (req: Request, res: Response) => {
  try {
    const { levelNumber, question, hint, answer, qrCode , location} = req.body;

    const answerHash = await bcrypt.hash(answer.toLowerCase().trim(), 10);

    const existingLevel = await Level.findOne({ levelNumber });

    if (existingLevel) {
      return res.status(400).json({
        message: "Level number already exists",
      });
    }

    const level = new Level({
      levelNumber,
      question,
      hint,
      answerHash,
      qrCode,
      location,
    });

    await level.save();

    res.status(201).json({
      message: "Level created successfully",
      level,
    });
  } catch (error) {
    res.status(500).json({
      message: `Server error ${error}`,
    });
  }
};

export const getLevels = async (req: Request, res: Response) => {
  try {
    const levels = await Level.find().sort({ levelNumber: 1 });

    res.json(levels);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

export const updateLevel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { question, hint, answer } = req.body;

    const updateData: any = { question, hint };

    if (answer) {
      updateData.answerHash = await bcrypt.hash(
        answer.toLowerCase().trim(),
        10,
      );
    }

    const level = await Level.findByIdAndUpdate(id, updateData, { new: true });

    if (!level) {
      return res.status(404).json({
        message: "Level not found",
      });
    }

    res.json(level);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

export const deleteLevel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const level = await Level.findByIdAndDelete(id);

    if (!level) {
      return res.status(404).json({
        message: "Level not found",
      });
    }

    res.json({
      message: "Level deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

export const startGame = async (req: Request, res: Response) => {
  try {
    const existingConfig = await GameConfig.findById("game-config");

    if (existingConfig && existingConfig.status === "active") {
      return res.status(400).json({
        message: "Game already started",
      });
    }

    const config = await GameConfig.findByIdAndUpdate(
      "game-config",
      {
        status: "active",
        startedAt: new Date(),
        endedAt: null,
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      },
    );

    res.json({
      message: "Game started successfully",
      startedAt: config?.startedAt,
    });
  } catch (error) {
    console.error("Error starting game:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

export const endGame = async (req: Request, res: Response) => {
  try {
    const config = await GameConfig.findById("game-config");

    if (!config || config.status !== "active") {
      return res.status(400).json({
        message: "Game is not active",
      });
    }

    const updatedConfig = await GameConfig.findByIdAndUpdate(
      "game-config",
      {
        status: "finished",
        endedAt: new Date(),
      },
      {
        returnDocument: "after",
      },
    );

    res.json({
      message: "Game ended successfully",
      endedAt: updatedConfig?.endedAt,
    });
  } catch (error) {
    console.error("Error ending game:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const getGameStatus = async (req: Request, res: Response) => {
  try {
    const config = await GameConfig.findById("game-config");

    if (!config) {
      return res.json({
        status: "waiting",
        startedAt: null,
        endedAt: null,
      });
    }

    res.json({
      status: config.status,
      startedAt: config.startedAt,
      endedAt: config.endedAt,
    });
  } catch (error) {
    console.error("Error fetching game status:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const resetGame = async (req: Request, res: Response) => {
  try {
    await User.updateMany(
      {},
      {
        $set: {
          currentLevel: 1,
          wrongAttempts: 0,
          lockUntil: null,
          locationUnlocked: false,
          gameStartedAt: null,
          gameCompletedAt: null,
          penaltyTime: 0,
        },
      },
    );

    await GameConfig.updateOne(
      {},
      {
        $set: {
          status: "inactive",
          startTime: null,
          endTime: null,
        },
      },
    );

    res.json({
      message: "Game reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to reset game",
    });
  }
};

export const exportLeaderboard = async (req: Request, res: Response) => {
  try {
    const users = await User.find({
      gameStartedAt: { $ne: null },
    }).sort({ gameCompletedAt: 1 });

    let rank = 1;

    const rows = users.map((user) => {
      const totalTime =
        user.gameCompletedAt && user.gameStartedAt
          ? (user.gameCompletedAt.getTime() - user.gameStartedAt.getTime()) /
            1000
          : null;

      const finalTime =
        totalTime !== null ? totalTime + user.penaltyTime : null;

      return {
        rank: rank++,
        name: user.username,
        email: user.email,
        level: user.currentLevel,
        totalTime,
        penaltyTime: user.penaltyTime,
        finalTime,
      };
    });

    let csv = "Rank,Name,Email,Level,TotalTime,PenaltyTime,FinalTime\n";

    rows.forEach((r) => {
      csv += `${r.rank},${r.name},${r.email},${r.level},${r.totalTime},${r.penaltyTime},${r.finalTime}\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment("leaderboard.csv");

    return res.send(csv);
  } catch (error) {
    res.status(500).json({
      message: "Failed to export leaderboard",
    });
  }
};
