import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    username: {
      type: String,
    },
    level: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
);

activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
export default mongoose.model("Activity", activitySchema);
