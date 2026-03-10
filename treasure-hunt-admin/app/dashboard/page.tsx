"use client";

import { useEffect, useState } from "react";
import API from "@/src/services/api";
import StatsCard from "@/src/components/StatsCard";

type Stats = {
  totalPlayers: number;
  activePlayers: number;
  completedPlayers: number;
  gameStatus: string;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const res = await API.get("/admin/stats");
      setStats(res.data);
    };

    fetchStats();
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      {" "}
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="flex gap-6 flex-wrap text-black">
        <StatsCard title="Total Players" value={stats.totalPlayers} />

        <StatsCard title="Active Players" value={stats?.activePlayers || 0} />

        <StatsCard title="Completed Players" value={stats?.completedPlayers || 0} />

        <StatsCard title="Game Status" value={stats.gameStatus.toUpperCase()} />
      </div>
    </div>
  );
}
