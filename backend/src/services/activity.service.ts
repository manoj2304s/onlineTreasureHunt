import Activity from "../models/activity.model";

export const createActivity = async (
  type: string,
  message: string,
  username?: string,
  level?: number,
) => {
  const activityData: any = {
    type,
    message,
  };

  if (username) activityData.username = username;
  if (level !== undefined) activityData.level = level;

  const activity = await Activity.create(activityData);

  return activity;
};

export const getRecentActivities = async () => {
  return Activity.find().sort({ createdAt: -1 }).limit(20).lean();
};
