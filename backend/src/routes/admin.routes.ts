import { Router } from "express";
import {
  createLevel,
  deleteLevel,
  getLevels,
  updateLevel,
} from "../controllers/admin.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/levels", protect, adminMiddleware, createLevel);
router.get("/levels", protect, adminMiddleware, getLevels);
router.put("/levels/:id", protect, adminMiddleware, updateLevel);
router.delete("/levels/:id", protect, adminMiddleware, deleteLevel);

export default router;
