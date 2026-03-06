import express from "express";
import {
  getCurrentLevel,
  getHint,
  getLeaderboard,
  submitAnswer,
} from "../controllers/game.controller";
import { protect } from "../middlewares/auth.middleware";
import { answerRateLimiter } from "../middlewares/ansRateLimiter.middleware";

const router = express.Router();

router.get("/current-level", protect, getCurrentLevel);
router.post("/submit-answer", protect, answerRateLimiter, submitAnswer);
router.get("/leaderboard", protect, getLeaderboard);
router.get("/hint", protect, getHint);

export default router;
