import { Player } from "@/src/types";

type Props = {
  players: Player[];
};


export default function PlayerTable({ players }: Props) {
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
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
