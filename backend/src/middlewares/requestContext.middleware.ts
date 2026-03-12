import { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";

export const requestContext = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const incomingRequestId = req.header("x-request-id");
  const requestId = incomingRequestId || randomUUID();

  (req as any).requestId = requestId;
  res.setHeader("x-request-id", requestId);

  next();
};
