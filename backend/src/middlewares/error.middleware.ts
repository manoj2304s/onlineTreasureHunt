import { NextFunction, Request, Response } from "express";

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
  void req;
  void next;

  if (res.headersSent) {
    return;
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({
    message,
  });
};
