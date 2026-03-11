"use client";

import { useEffect, useState } from "react";
import API from "@/src/services/api";
import PlayerTable from "@/src/components/PlayerTable";
import { Player } from "@/src/types";
import { socket } from "@/src/services/socket";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const res = await API.get("/admin/players");
      setPlayers(res.data);
    };
    fetchPlayers();
    socket.on("player:update", (updatedPlayer: Player) => {
      setPlayers((prev) =>
        prev.map((p) => (p.userId === updatedPlayer.userId ? updatedPlayer : p)),
      );
    });
    return () => {
      socket.off("player:update");
    };
  }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-white">Player Monitor</h1>

      <PlayerTable players={players} />
    </div>
  );
}
