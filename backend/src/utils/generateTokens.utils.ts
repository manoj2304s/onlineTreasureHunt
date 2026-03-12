import jwt from "jsonwebtoken";

const generateToken = (userId: string) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ id: userId }, jwtSecret, {
    expiresIn: "1d",
  });
};

export default generateToken;
