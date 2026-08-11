import { Router } from "express";
import {
  register,
  login,
  promoteAdmin,
  getCurrentUser,
} from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { protect } from "../middlewares/auth.middleware";
import {
  registerSchema,
  loginSchema,
  promoteAdminSchema,
} from "../validators/auth.validator";
import {
  loginRateLimiter,
  registerRateLimiter,
} from "../middlewares/authRateLimiter.middleware";

const router = Router();

router.post("/register", registerRateLimiter, validate(registerSchema), register);
router.post("/login", loginRateLimiter, validate(loginSchema), login);
router.post("/promote-admin", loginRateLimiter, validate(promoteAdminSchema), promoteAdmin);
router.get("/me", protect, getCurrentUser);

export default router;
