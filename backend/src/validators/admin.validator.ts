import { z } from "zod";

export const createLevelSchema = z.object({
  levelNumber: z.number().int().positive(),
  question: z.string().trim().min(1, "Question is required"),
  hint: z.string().trim().optional(),
  answer: z.string().trim().min(1, "Answer is required"),
  qrCode: z.string().trim().min(1, "QR code is required"),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});

export const updateLevelSchema = z
  .object({
    question: z.string().trim().min(1).optional(),
    hint: z.string().trim().optional(),
    answer: z.string().trim().min(1).optional(),
    qrCode: z.string().trim().min(1).optional(),
    location: z
      .object({
        latitude: z.number(),
        longitude: z.number(),
      })
      .optional(),
  })
  .refine(
    (data) =>
      data.question !== undefined ||
      data.hint !== undefined ||
      data.answer !== undefined ||
      data.qrCode !== undefined ||
      data.location !== undefined,
    {
      message: "At least one field must be provided",
    },
  );
