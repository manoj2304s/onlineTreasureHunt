import express from "express";
import { getCurrentLevel, submitAnswer } from "../controllers/game.controller";
import { protect } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/current-level", protect, getCurrentLevel);
router.post("/submit-answer", protect, submitAnswer);

export default router;
