"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { socket } from "@/src/services/socket";
import { getErrorMessage } from "@/src/lib/httpError";
import { getActivities } from "../services/adminGameService";

type Activity = {
  _id?: string;
  message: string;
  username?: string;
  level?: number;
  createdAt?: string;
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const activity = await getActivities();
        setActivities(Array.isArray(activity) ? activity : []);
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to fetch activities."));
      }
    };

    const handleActivityUpdate = (activity: Activity) => {
      setActivities((prev) => [activity, ...prev].slice(0, 20));
    };

    loadActivities();

    socket.on("activity:update", handleActivityUpdate);

    return () => {
      socket.off("activity:update", handleActivityUpdate);
    };
  }, []);

  return (
    <div className="panel rise-in p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="live-dot" />
        <h2 className="text-xl font-bold">Live Activity</h2>
      </div>

      <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {activities.map((a, i) => (
          <li key={a._id || i} className="subtle-card text-sm text-black/80 px-3 py-2">
            {a.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
