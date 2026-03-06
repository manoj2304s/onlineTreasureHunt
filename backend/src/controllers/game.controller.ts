import { Request, Response } from "express";
import Level from "../models/level.model"; 

export const getCurrentLevel = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const currentLevel = await Level.findOne({ levelNumber: user.currentLevel });

        if (!currentLevel) {
            return res.status(404).json({ message: "Current level not found" });
        }

        res.status(200).json({
            levelNumber: currentLevel.levelNumber,
            description: currentLevel.question,
            hint: currentLevel.hint,
        });
    }catch (error) {
        console.error("Error fetching current level:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}