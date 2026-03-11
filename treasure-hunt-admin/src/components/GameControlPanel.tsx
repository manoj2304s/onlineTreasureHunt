"use client";

import { useEffect, useState } from "react";
import {
  startGame,
  endGame,
  resetGame,
  getGameStatus,
} from "@/src/services/adminGameService";
import { socket } from "@/src/services/socket";

type Status = "waiting" | "inactive" | "active" | "finished";

export default function GameControlPanel() {
  const [status, setStatus] = useState<Status>("waiting");

  useEffect(() => {
    const fetchStatus = async () => {
      const data = await getGameStatus();
      setStatus(data.status);
    };

    fetchStatus();

    socket.on("game:status", (newStatus: Status) => {
      setStatus(newStatus);
    });

    return () => {
      socket.off("game:status");
    };
  }, []);

  const handleStart = async () => {
    await startGame();
  };

  const handleEnd = async () => {
    if (!confirm("End the game?")) return;
    await endGame();
  };

  const handleReset = async () => {
    if (!confirm("Reset the entire game?")) return;
    await resetGame();
  };

  return (
    <div className="p-6 border rounded-xl shadow-md bg-white space-y-4">
      <h2 className="text-xl font-bold">Game Control Panel</h2>

      <div className="flex items-center gap-3">
        <span className="font-semibold">Game Status:</span>

        <span
          className={`px-3 py-1 rounded text-white ${
            status === "active"
              ? "bg-green-600"
              : status === "finished"
                ? "bg-red-600"
                : "bg-gray-500"
          }`}
        >
          {status.toUpperCase()}
        </span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleStart}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Start Game
        </button>

        <button
          onClick={handleEnd}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          End Game
        </button>

        <button
          onClick={handleReset}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Reset Game
        </button>
      </div>
    </div>
  );
}
