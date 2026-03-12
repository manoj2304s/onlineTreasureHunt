import { Request, Response } from "express";
import mongoose from "mongoose";

export const healthCheck = (req: Request, res: Response) => {
  void req;
  res.status(200).json({
    status: "OK",
    message: "Server is healthy",
    uptimeSeconds: Math.round(process.uptime()),
    timeStamp: new Date().toISOString(),
  });
};

export const readinessCheck = (req: Request, res: Response) => {
  void req;
  const dbConnected = mongoose.connection.readyState === 1;

  if (!dbConnected) {
    return res.status(503).json({
      status: "NOT_READY",
      dbConnected: false,
      timeStamp: new Date().toISOString(),
    });
  }

  return res.status(200).json({
    status: "READY",
    dbConnected: true,
    timeStamp: new Date().toISOString(),
  });
};
