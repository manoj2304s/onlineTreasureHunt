"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import PlayerTable from "@/src/components/PlayerTable";
import { Player } from "@/src/types";
import { socket } from "@/src/services/socket";
import { getErrorMessage } from "@/src/lib/httpError";
import { getPlayers } from "@/src/services/adminPlayerService";

export default function PlayersPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  const fetchPlayers = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const data = await getPlayers();
      setPlayers(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to fetch players."));
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchPlayers();

    const handlePlayerUpdate = () => {
      fetchPlayers(true);
    };

    socket.on("player:update", handlePlayerUpdate);
    return () => {
      socket.off("player:update", handlePlayerUpdate);
    };
  }, [fetchPlayers]);

  const filteredPlayers = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return players;
    return players.filter((player) => player.username.toLowerCase().includes(q));
  }, [players, searchText]);

  return (
    <div className="fade-in space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#1f1d1a]">Player Monitor</h1>

        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search username"
          className="input w-full md:w-80"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-[#5a564e]">Loading players...</p>
      ) : (
        <div className="panel overflow-x-auto p-4">
          <PlayerTable
            players={filteredPlayers}
            onPlayerClick={(playerId) => router.push(`/dashboard/players/${playerId}`)}
          />
        </div>
      )}
    </div>
  );
}
