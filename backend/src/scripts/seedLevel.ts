import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Level from "../models/level.model";

async function seedLevels() {
  await mongoose.connect(process.env.DB_URL as string);

  const answer = "echo";

  const answerHash = await bcrypt.hash(answer, 10);

  await Level.create({
    levelNumber: 1,
    question:
      "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?",
    answerHash: answerHash,
    hint: "It's a common command in Unix-based systems.",
    qrCode: "QR_START_001",
    location: {
      latitude: 13.0254172,
      longitude: 76.1123468,
    },
  });

  console.log("Levels seeded successfully!");
  process.exit(0);
}

seedLevels();
