"use client";

import { useEffect, useState } from "react";
import { socket } from "@/src/services/socket";

type Activity = {
  username: string;
  currentLevel: number;
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    socket.on("player:update", (player: Activity) => {
      setActivities((prev) => [player, ...prev.slice(0, 9)]);
    });

    return () => {
      socket.off("player:update");
    };
  }, []);

  return (
    <div className="p-6 border rounded-xl shadow-md bg-white">
      <h2 className="text-xl font-bold mb-4">Live Activity</h2>

      <ul className="space-y-2">
        {activities.map((a, i) => (
          <li key={i} className="text-sm text-black/80">
            <span className="font-semibold">{a.username}</span> reached level{" "}
            {a.currentLevel}
          </li>
        ))}
      </ul>
    </div>
  );
}
