import { Router } from "express";
import {
  healthCheck,
  readinessCheck,
} from "../controllers/health.controller";

const router = Router();

router.get("/", healthCheck);
router.get("/readiness", readinessCheck);

export default router;
