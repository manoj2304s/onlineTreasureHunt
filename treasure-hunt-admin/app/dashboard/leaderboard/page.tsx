"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { socket } from "@/src/services/socket";
import { getLeaderboard } from "@/src/services/leaderboardService";
import { getErrorMessage } from "@/src/lib/httpError";

interface Player {
  rank: number;
  username: string;
  currentLevel: number;
  time: number;
  userId?: string;
}

type RowAnimation = "up" | "down" | "same";
const ROW_ANIMATION_MS = 12000;

export default function LiveLeaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [rowAnimations, setRowAnimations] = useState<Record<string, RowAnimation>>({});
  const previousPositionsRef = useRef<Map<string, number>>(new Map());
  const animationTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const getPlayerKey = (player: Player) => player.userId || player.username;

  const applyLeaderboardUpdate = useCallback((nextPlayers: Player[]) => {
    const safePlayers = Array.isArray(nextPlayers) ? nextPlayers : [];
    const nextAnimations: Record<string, RowAnimation> = {};
    const nextPositions = new Map<string, number>();

    safePlayers.forEach((player, nextIndex) => {
      const key = getPlayerKey(player);
      const previousIndex = previousPositionsRef.current.get(key);

      if (typeof previousIndex === "number") {
        if (nextIndex < previousIndex) {
          nextAnimations[key] = "up";
        } else if (nextIndex > previousIndex) {
          nextAnimations[key] = "down";
        } else {
          nextAnimations[key] = "same";
        }
      } else {
        nextAnimations[key] = "same";
      }

      nextPositions.set(key, nextIndex);
    });

    previousPositionsRef.current = nextPositions;
    setPlayers(safePlayers);

    setRowAnimations(nextAnimations);
    Object.keys(nextAnimations).forEach((key) => {
      if (nextAnimations[key] === "same") {
        return;
      }

      const existingTimer = animationTimersRef.current[key];
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      animationTimersRef.current[key] = setTimeout(() => {
        setRowAnimations((prev) => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      }, ROW_ANIMATION_MS);
    });
  }, []);

  useEffect(() => {
    const timers = animationTimersRef.current;

    const loadLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        applyLeaderboardUpdate(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to fetch leaderboard."));
      }
    };

    const handleLeaderboardUpdate = (data: Player[]) => {
      applyLeaderboardUpdate(Array.isArray(data) ? data : []);
    };

    loadLeaderboard();
    socket.on("leaderboard:update", handleLeaderboardUpdate);

    return () => {
      socket.off("leaderboard:update", handleLeaderboardUpdate);
      Object.values(timers).forEach((timer) => clearTimeout(timer));
    };
  }, [applyLeaderboardUpdate]);

  const getRowAnimationClass = (player: Player) => {
    const state = rowAnimations[getPlayerKey(player)];
    if (state === "up") return "leaderboard-row-up";
    if (state === "down") return "leaderboard-row-down";
    return "";
  };

  const getMovementLabel = (player: Player) => {
    const state = rowAnimations[getPlayerKey(player)];
    if (state === "up") {
      return <span className="text-xs font-semibold text-emerald-700">^ UP</span>;
    }
    if (state === "down") {
      return <span className="text-xs font-semibold text-orange-700">v DOWN</span>;
    }
    return <span className="text-xs text-[#5a564e]">Stable</span>;
  };

  const formatTime = (seconds: number | null | undefined) => {
    if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
      return "--:--";
    }

    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const topThree = useMemo(
    () => players.filter((player) => player.rank <= 3),
    [players],
  );

  return (
    <div className="fade-in space-y-6">
      <div className="panel p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1f1d1a] md:text-4xl">Online Treasure Hunt</h1>
            <p className="text-sm uppercase tracking-[0.16em] text-[#5a564e]">Live Leaderboard</p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
            <span className="live-dot" />
            Real-time socket feed
          </div>
        </div>

        {topThree.length ? (
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {topThree.map((player) => (
              <div key={`top-${getPlayerKey(player)}`} className="subtle-card px-4 py-3">
                <p className="text-xs uppercase tracking-[0.12em] text-[#5a564e]">Rank #{player.rank}</p>
                <p className="mt-1 text-lg font-bold text-[#1f1d1a]">{player.username}</p>
                <p className="text-sm text-[#5a564e]">Level {player.currentLevel}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="data-table min-w-[720px]">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Level</th>
                <th>Time</th>
              </tr>
            </thead>

            <tbody>
              {players.map((player) => {
                const key = getPlayerKey(player);
                return (
                  <tr key={key} className={`transition ${getRowAnimationClass(player)}`}>
                    <td className="font-semibold">#{player.rank}</td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span>{player.username}</span>
                        {getMovementLabel(player)}
                      </div>
                    </td>
                    <td>{player.currentLevel}</td>
                    <td className="font-mono">{formatTime(player.time)}</td>
                  </tr>
                );
              })}

              {!players.length ? (
                <tr>
                  <td colSpan={4} className="text-center text-[#5a564e]">
                    No leaderboard data yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
