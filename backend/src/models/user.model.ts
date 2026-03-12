import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    currentLevel: { type: Number, default: 1 },
    levelOrder: { type: [Number], default: [] },
    gameStartedAt: { type: Date },
    gameCompletedAt: { type: Date },
    wrongAttempts: { type: Number, default: 0 },
    penaltyTime: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    hintUsedLevels: { type: [Number], default: [] },
    role: { type: String, enum: ["player", "admin"], default: "player" },
    locationUnlocked: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
