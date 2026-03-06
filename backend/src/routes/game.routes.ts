import express from "express";
import { getCurrentLevel } from "../controllers/game.controller";
import { protect } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/current-level", protect, getCurrentLevel);

export default router;
