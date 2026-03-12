import express from "express";
import {
  getCurrentLevel,
  getHint,
  getLeaderboard,
  submitAnswer,
  unlockLocation,
} from "../controllers/game.controller";
import { protect } from "../middlewares/auth.middleware";
import { answerRateLimiter } from "../middlewares/ansRateLimiter.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  submitAnswerSchema,
  unlockLocationSchema,
} from "../validators/game.validator";

const router = express.Router();

router.get("/current-level", protect, getCurrentLevel);
router.post(
  "/submit-answer",
  protect,
  answerRateLimiter,
  validate(submitAnswerSchema),
  submitAnswer,
);
router.get("/leaderboard", protect, getLeaderboard);
router.get("/hint", protect, getHint);
router.post(
  "/unlock-location",
  protect,
  validate(unlockLocationSchema),
  unlockLocation,
);

export default router;
