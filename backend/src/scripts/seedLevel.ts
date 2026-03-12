import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Level from "../models/level.model";

async function seedLevels() {
  dotenv.config();

  if (!process.env.DB_URL) {
    throw new Error("DB_URL is required for seeding");
  }

  await mongoose.connect(process.env.DB_URL);

  const answer = "echo";

  const answerHash = await bcrypt.hash(answer, 10);

  await Level.updateOne(
    { levelNumber: 1 },
    {
      $set: {
        question:
          "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?",
        answerHash: answerHash,
        hint: "It's a common command in Unix-based systems.",
        qrCode: "QR_START_001",
        location: {
          latitude: 13.0254172,
          longitude: 76.1123468,
        },
      },
    },
    { upsert: true },
  );

  console.log("Levels seeded successfully!");
  process.exit(0);
}

seedLevels();
