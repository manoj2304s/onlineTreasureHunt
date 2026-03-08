import { Response, Request } from "express";
import Level from "../models/level.model";
import { GameConfig } from "../models/gameConfig.model";
import bcrypt from "bcrypt";

export const createLevel = async (req: Request, res: Response) => {
  try {
    const { levelNumber, question, hint, answer } = req.body;

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
    });

    await level.save();

    res.status(201).json({
      message: "Level created successfully",
      level,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
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
