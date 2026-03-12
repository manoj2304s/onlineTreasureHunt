import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      if (!process.env.JWT_SECRET) {
        return res.status(500).json({
          message: "JWT_SECRET is not configured",
        });
      }

      if (!token) {
        return res.status(401).json({
          message: "Not authorized, no token",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as unknown as {
        id: string;
      };

      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({
          message: "Not authorized, user not found",
        });
      }

      (req as any).user = user;

      next();
    } else {
      return res.status(401).json({
        message: "Not authorized, no token",
      });
    }
  } catch (error) {
    return res.status(401).json({
      message: "Token invalid",
    });
  }
};
