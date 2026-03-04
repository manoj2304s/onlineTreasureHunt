import { Request, Response } from "express";

export const register = (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  res.status(201).json({
    message: "User registered successfully",
    user: {
      username,
      email,
    },
  });
};
