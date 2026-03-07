import mongoose from "mongoose";

const GameConfigSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["waiting", "active", "finished"],
    default: "waiting",
  },
  startedAt: {
    type: Date,
  },
  endedAt: {
    type: Date,
  },
});

export const GameConfig = mongoose.model("GameConfig", GameConfigSchema);
