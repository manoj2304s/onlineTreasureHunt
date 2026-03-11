"use client";

import { useEffect, useState } from "react";
import { socket } from "@/src/services/socket";

interface Player {
  rank: number;
  username: string;
  currentLevel: number;
  time: number;
}

export default function LiveLeaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    socket.on("leaderboard:update", (data: Player[]) => {
      setPlayers(data);
    });

    return () => {
      socket.off("leaderboard:update");
    };
  }, []);

  const formatTime = (seconds: number) => {
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
