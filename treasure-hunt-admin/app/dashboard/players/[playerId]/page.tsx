"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/src/lib/httpError";
import { PlayerDetails } from "@/src/types";
import {
  advancePlayer,
  getPlayerDetails,
  resetPlayer,
  unlockPlayer,
} from "@/src/services/adminPlayerService";

type ActionType = "unlock" | "advance" | "reset" | null;

const formatLabel = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());

const formatDuration = (seconds: number | null | undefined) => {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return "--:--";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const renderValue = (key: string, value: unknown) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  if (typeof value === "number") {
    if (key === "penaltyTime" || key === "playingTime" || key === "totalTime") {
      return formatDuration(value);
    }
    return String(value);
  }
  if (typeof value === "string") {
    if (key.toLowerCase().includes("at")) {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString();
      }
    }
    return value;
  }
  return JSON.stringify(value);
};

export default function PlayerDetailsPage() {
  const params = useParams<{ playerId: string }>();
  const router = useRouter();
  const playerId = params.playerId;

  const [player, setPlayer] = useState<PlayerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<ActionType>(null);

  const loadPlayer = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getPlayerDetails(playerId);
      setPlayer(data);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to fetch player details."));
    } finally {
      setIsLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    if (!playerId) return;
    loadPlayer();
  }, [loadPlayer, playerId]);

  const handleAction = async (action: Exclude<ActionType, null>) => {
    if (!playerId || pendingAction) return;

    if (action === "reset") {
      const ok = confirm("Reset this player's progress?");
      if (!ok) return;
    }

    try {
      setPendingAction(action);

      if (action === "unlock") {
        await unlockPlayer(playerId);
        toast.success("Player unlocked.");
      } else if (action === "advance") {
        await advancePlayer(playerId);
        toast.success("Player advanced.");
      } else {
        await resetPlayer(playerId);
        toast.success("Player reset.");
      }

      await loadPlayer();
    } catch (error) {
      toast.error(getErrorMessage(error, `Failed to ${action} player.`));
    } finally {
      setPendingAction(null);
    }
  };

  const detailRows = useMemo(() => {
    if (!player) return [];
    const excludedKeys = new Set(["password", "createdAt", "updatedAt", "lockedUntil"]);
    return Object.entries(player).filter(([key]) => !excludedKeys.has(key));
  }, [player]);

  return (
    <div className="fade-in space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#1f1d1a]">Player Details</h1>
        <button className="btn btn-neutral" onClick={() => router.push("/dashboard/players")}>
          Back to Players
        </button>
      </div>

      <div className="panel p-5">
        <h2 className="mb-4 text-xl font-semibold text-[#1f1d1a]">Player Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleAction("unlock")}
            disabled={Boolean(pendingAction)}
            className="btn btn-primary"
          >
            {pendingAction === "unlock" ? "Unlocking..." : "Unlock Player"}
          </button>

          <button
            onClick={() => handleAction("advance")}
            disabled={Boolean(pendingAction)}
            className="btn btn-info"
          >
            {pendingAction === "advance" ? "Advancing..." : "Advance Player"}
          </button>

          <button
            onClick={() => handleAction("reset")}
            disabled={Boolean(pendingAction)}
            className="btn btn-danger"
          >
            {pendingAction === "reset" ? "Resetting..." : "Reset Player"}
          </button>
        </div>
      </div>

      <div className="panel overflow-x-auto p-4">
        {isLoading ? (
          <p className="text-sm text-[#5a564e]">Loading player details...</p>
        ) : !player ? (
          <p className="text-sm text-[#5a564e]">Player not found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map(([key, value]) => (
                <tr key={key}>
                  <td className="font-semibold">{formatLabel(key)}</td>
                  <td>{renderValue(key, value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
