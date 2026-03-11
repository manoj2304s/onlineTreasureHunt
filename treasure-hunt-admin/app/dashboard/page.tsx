"use client";

import { useEffect, useState } from "react";
import API from "@/src/services/api";
import StatsCard from "@/src/components/StatsCard";
import ActivityFeed from "@/src/components/ActivityFeed";
import GameControlPanel from "@/src/components/GameControlPanel";

type Stats = {
  totalPlayers: number;
  playersStarted: number;
  playersCompleted: number;
  gameStatus: string;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get("/admin/stats");
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };

    fetchStats();
  }, []);
  console.log(stats);
  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      {" "}
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="flex gap-6 flex-wrap text-black">
        <StatsCard title="Total Players" value={stats.totalPlayers} />

        <StatsCard title="Active Players" value={stats.playersStarted} />

        <StatsCard title="Completed Players" value={stats.playersCompleted} />

        <StatsCard title="Game Status" value={stats.gameStatus.toUpperCase()} />
      </div>
      <div className="grid grid-cols-2 gap-6 text-black mt-6">
        <GameControlPanel />
        <ActivityFeed />
      </div>
    </div>
  );
}
