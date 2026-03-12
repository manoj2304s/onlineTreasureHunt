import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const corsOriginsRaw = process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN;

const envSchema = z.object({
  DB_URL: z.string().min(1, "DB_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  CORS_ORIGINS: z.string().min(1, "CORS_ORIGINS is required"),
  BODY_LIMIT: z.string().default("100kb"),
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.string().optional(),
});

const parsed = envSchema.safeParse({
  ...process.env,
  CORS_ORIGINS: corsOriginsRaw,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

const corsOrigins = parsed.data.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (corsOrigins.length === 0) {
  throw new Error("Invalid environment configuration: CORS_ORIGINS is empty");
}

export const env = {
  ...parsed.data,
  CORS_ORIGINS: corsOrigins,
};
