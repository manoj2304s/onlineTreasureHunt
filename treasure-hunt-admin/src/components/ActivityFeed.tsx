"use client";

import { useEffect, useState } from "react";
import { socket } from "@/src/services/socket";
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
        console.error("Failed to fetch activities:", error);
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
    <div className="p-6 border rounded-xl shadow-md bg-white">
      <h2 className="text-xl font-bold mb-4">Live Activity</h2>

      <ul className="space-y-2">
        {activities.map((a, i) => (
          <li key={a._id || i} className="text-sm text-black/80">
            {a.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
