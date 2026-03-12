"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  startGame,
  endGame,
  resetGame,
  getGameStatus,
} from "@/src/services/adminGameService";
import { socket } from "@/src/services/socket";
import { getErrorMessage } from "@/src/lib/httpError";

type Status = "waiting" | "inactive" | "active" | "finished";
type ActionType = "start" | "end" | "reset" | null;

export default function GameControlPanel() {
  const [status, setStatus] = useState<Status>("waiting");
  const [pendingAction, setPendingAction] = useState<ActionType>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getGameStatus();
        setStatus(data.status);
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to fetch game status."));
      }
    };

    fetchStatus();

    const onStatusUpdate = (newStatus: Status) => {
      setStatus(newStatus);
    };

    socket.on("game:status", onStatusUpdate);

    return () => {
      socket.off("game:status", onStatusUpdate);
    };
  }, []);

  const handleStart = async () => {
    if (pendingAction) return;

    try {
      setPendingAction("start");
      await startGame();
      toast.success("Game started.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to start game."));
    } finally {
      setPendingAction(null);
    }
  };

  const handleEnd = async () => {
    if (pendingAction) return;
    if (!confirm("End the game?")) return;

    try {
      setPendingAction("end");
      await endGame();
      toast.success("Game ended.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to end game."));
    } finally {
      setPendingAction(null);
    }
  };

  const handleReset = async () => {
    if (pendingAction) return;
    if (!confirm("Reset the entire game?")) return;

    try {
      setPendingAction("reset");
      await resetGame();
      toast.success("Game reset completed.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to reset game."));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="panel rise-in space-y-4 p-6">
      <h2 className="text-xl font-bold">Game Control Panel</h2>

      <div className="flex items-center gap-3">
        <span className="font-semibold text-[#1f1d1a]">Game Status:</span>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white ${
            status === "active"
              ? "bg-emerald-600"
              : status === "finished"
                ? "bg-red-600"
                : "bg-slate-500"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="flex w-full flex-col gap-6 mt-6">
        <button
          onClick={handleStart}
          disabled={Boolean(pendingAction) || status === "active"}
          className="btn btn-primary w-full"
        >
          {pendingAction === "start" ? "Starting..." : "Start Game"}
        </button>

        <button
          onClick={handleEnd}
          disabled={Boolean(pendingAction) || status !== "active"}
          className="btn btn-warn w-full"
        >
          {pendingAction === "end" ? "Ending..." : "End Game"}
        </button>

        <button
          onClick={handleReset}
          disabled={Boolean(pendingAction)}
          className="btn btn-danger w-full"
        >
          {pendingAction === "reset" ? "Resetting..." : "Reset Game"}
        </button>
      </div>
    </div>
  );
}
