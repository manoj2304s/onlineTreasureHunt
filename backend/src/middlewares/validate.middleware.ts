import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

export const validate =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", error: result.error.issues });
    }
    req.body = result.data;
    next();
  };
