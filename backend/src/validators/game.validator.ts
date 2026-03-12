import { z } from "zod";

export const submitAnswerSchema = z.object({
  answer: z.string().trim().min(1, "Answer is required"),
});

export const unlockLocationSchema = z.object({
  qrCode: z.string().trim().min(1, "QR code is required"),
});
