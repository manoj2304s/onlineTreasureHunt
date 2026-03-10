import mongoose from "mongoose";

const levelSchema = new mongoose.Schema(
  {
    levelNumber: { type: Number, required: true, unique: true },
    question: { type: String, required: true },
    answerHash: { type: String, required: true },
    hint: { type: String },
    qrCode: { type: String, required: true },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    }
  },
  { timestamps: true },
);

export default mongoose.model("Level", levelSchema);
