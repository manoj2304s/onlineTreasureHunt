import { Router } from "express";
import {
  register,
  login,
  getCurrentUser,
} from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { protect } from "../middlewares/auth.middleware";
import { registerSchema, loginSchema } from "../validators/auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", protect, getCurrentUser);

export default router;
