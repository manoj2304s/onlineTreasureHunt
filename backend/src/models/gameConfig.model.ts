import mongoose from "mongoose";

const GameConfigSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: "game-config",
  },
  status: {
    type: String,
    enum: ["inactive", "active", "finished"],
    default: "inactive",
  },
  startedAt: {
    type: Date,
  },
  endedAt: {
    type: Date,
  },
});

export const GameConfig = mongoose.model("GameConfig", GameConfigSchema);
