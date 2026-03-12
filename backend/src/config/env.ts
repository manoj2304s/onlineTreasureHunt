import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DB_URL: z.string().min(1, "DB_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN is required"),
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = parsed.data;
