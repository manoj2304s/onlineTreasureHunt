import jwt from "jsonwebtoken";
import { env } from "../config/env";

const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

export default generateToken;
