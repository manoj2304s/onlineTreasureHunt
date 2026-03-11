import { Player } from "@/src/types";
import {
  unlockPlayer,
  advancePlayer,
  resetPlayer,
} from "@/src/services/adminPlayerService";

type Props = {
  players: Player[];
};

export default function PlayerTable({ players }: Props) {
  const handleUnlock = async (playerId: string) => {
    try {
      await unlockPlayer(playerId);
      alert("Player unlocked");
    } catch {
      alert("Failed to unlock player");
    }
  };

  const handleAdvance = async (playerId: string) => {
    try {
      await advancePlayer(playerId);
      alert("Player advanced");
    } catch {
      alert("Failed to advance player");
    }
  };

  const handleReset = async (playerId: string) => {
    const confirmReset = confirm("Reset this player's progress?");
    if (!confirmReset) return;

    try {
      await resetPlayer(playerId);
      alert("Player reset");
    } catch {
      alert("Failed to reset player");
    }
  };
  return (
    <table className="w-full bg-white shadow rounded">
      <thead className="bg-gray-200">
        <tr className="text-black">
          <th className="p-3 text-left">Username</th>
          <th className="p-3 text-left">Level</th>
          <th className="p-3 text-left">Attempts</th>
          <th className="p-3 text-left">Status</th>
          <th className="p-3 text-left">Action</th>
        </tr>
      </thead>

      <tbody>
        {players.map((player) => {
          let status = "Active";

          if (player.gameCompletedAt) status = "Finished";

          return (
            <tr key={player.userId} className="border-t text-black">
              <td className="p-3">{player.username}</td>
              <td className="p-3">{player.currentLevel}</td>
              <td className="p-3">{player.wrongAttempts}</td>
              <td className="p-3">{status}</td>
              <td className="space-x-2 flex flex-wrap p-3">
                <button
                  onClick={() => handleUnlock(player.userId)}
                  className="bg-green-500 text-white px-3 py-1 rounded"
                >
                  Unlock
                </button>

                <button
                  onClick={() => handleAdvance(player.userId)}
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                  Advance
                </button>

                <button
                  onClick={() => handleReset(player.userId)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Reset
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
