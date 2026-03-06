import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Level from "../models/level.model";

async function seedLevels() {
    await mongoose.connect("mongodb://localhost:27017/treasurehunt") 

    const answer = "echo"

    const answerHash = await bcrypt.hash(answer, 10); 

    await Level.create({
        levelNumber: 1,
        question: "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?",
        answerHash: answerHash,
        hint: "It's a common command in Unix-based systems.",
    })

    console.log("Levels seeded successfully!");
    process.exit(0);
}

seedLevels()
