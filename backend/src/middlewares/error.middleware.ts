import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  void next;

  if (res.headersSent) {
    return;
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error("unhandled_error", {
    requestId: (req as any).requestId || "-",
    method: req.method,
    path: req.originalUrl,
    message,
  });

  res.status(500).json({
    message,
  });
};
