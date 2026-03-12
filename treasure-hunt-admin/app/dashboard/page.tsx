"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import API from "@/src/services/api";
import StatsCard from "@/src/components/StatsCard";
import ActivityFeed from "@/src/components/ActivityFeed";
import GameControlPanel from "@/src/components/GameControlPanel";
import { getErrorMessage } from "@/src/lib/httpError";

type Stats = {
  totalPlayers: number;
  playersStarted: number;
  playersCompleted: number;
  gameStatus: string;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getGameStatusColor = (status: string) => {
    const normalized = status.toLowerCase();

    if (normalized === "active") return "text-emerald-600";
    if (normalized === "inactive") return "text-red-600";
    if (normalized === "finished") return "text-amber-500";
    return "text-[#1f1d1a]";
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get("/admin/stats");
        setStats(res.data);
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to fetch dashboard stats."));
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);
  if (isLoading) return <div>Loading dashboard...</div>;
  if (!stats) return <div>Unable to load dashboard stats.</div>;

  return (
    <div className="space-y-6 fade-in">
      <h1 className="text-2xl font-bold text-[#1f1d1a]">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 text-black md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Players" value={stats.totalPlayers} />

        <StatsCard title="Active Players" value={stats.playersStarted} />

        <StatsCard title="Completed Players" value={stats.playersCompleted} />

        <StatsCard
          title="Game Status"
          value={stats.gameStatus.toUpperCase()}
          valueClassName={getGameStatusColor(stats.gameStatus)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 text-black xl:grid-cols-[minmax(320px,30%)_minmax(0,70%)]">
        <GameControlPanel />
        <ActivityFeed />
      </div>
    </div>
  );
}
