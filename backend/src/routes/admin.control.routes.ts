import express from "express";
import {
  unlockPlayer,
  resetPlayer,
  advancePlayer,
} from "../controllers/admin.control.controller";
import {adminMiddleware} from "../middlewares/admin.middleware";
import { protect } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/player/unlock/:playerId",protect, adminMiddleware, unlockPlayer);
router.post("/player/reset/:playerId", protect, adminMiddleware, resetPlayer);
router.post("/player/advance/:playerId", protect, adminMiddleware, advancePlayer);

export default router;
