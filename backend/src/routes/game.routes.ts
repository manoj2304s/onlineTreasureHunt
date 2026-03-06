import express from "express";
import {
  getCurrentLevel,
  getHint,
  getLeaderboard,
  submitAnswer,
} from "../controllers/game.controller";
import { protect } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/current-level", protect, getCurrentLevel);
router.post("/submit-answer", protect, submitAnswer);
router.get("/leaderboard", protect, getLeaderboard);
router.get("/hint", protect, getHint);

export default router;
