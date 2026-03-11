"use client";

import { useEffect, useState } from "react";
import { socket } from "@/src/services/socket";
import { getLeaderboard } from "@/src/services/leaderboardService";

interface Player {
  rank: number;
  username: string;
  currentLevel: number;
  time: number;
}

export default function LiveLeaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        setPlayers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      }
    };

    const handleLeaderboardUpdate = (data: Player[]) => {
      setPlayers(Array.isArray(data) ? data : []);
    };

    loadLeaderboard();
    socket.on("leaderboard:update", handleLeaderboardUpdate);

    return () => {
      socket.off("leaderboard:update", handleLeaderboardUpdate);
    };
  }, []);

  const formatTime = (seconds: number | null | undefined) => {
    if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
      return "--:--";
    }

    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-10">
      <h1 className="text-5xl font-bold mb-10">ONLINE TREASURE HUNT</h1>

      <h2 className="text-3xl mb-8">LIVE LEADERBOARD</h2>

      <table className="w-full max-w-5xl text-center border-collapse">
        <thead>
          <tr className="text-2xl border-b border-gray-500">
            <th className="p-4">Rank</th>
            <th className="p-4">Player</th>
            <th className="p-4">Level</th>
            <th className="p-4">Time</th>
          </tr>
        </thead>

        <tbody>
          {players.map((player) => (
            <tr
              key={player.username}
              className="text-xl border-b border-gray-800"
            >
              <td className="p-4 font-bold">{player.rank}</td>
              <td className="p-4">{player.username}</td>
              <td className="p-4">{player.currentLevel}</td>
              <td className="p-4">{formatTime(player.time)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
