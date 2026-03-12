import { Player } from "@/src/types";

type Props = {
  players: Player[];
  onPlayerClick: (playerId: string) => void;
};

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

export default function PlayerTable({ players, onPlayerClick }: Props) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Team Name</th>
          <th>Level</th>
          <th>Attempts</th>
          <th>Status</th>
          <th>Penalty Time</th>
          <th>Playing Time</th>
          <th>Total Time</th>
        </tr>
      </thead>

      <tbody>
        {!players.length ? (
          <tr>
            <td colSpan={7} className="text-center text-[color:var(--foreground-muted)]">
              No players found.
            </td>
          </tr>
        ) : null}

        {players.map((player) => {
          let status = "Active";

          if (player.gameCompletedAt) status = "Finished";

          return (
            <tr
              key={player.userId}
              onClick={() => onPlayerClick(player.userId)}
              className="cursor-pointer transition hover:bg-lime-500/10"
            >
              <td>{player.username}</td>
              <td>{player.currentLevel}</td>
              <td>{player.wrongAttempts}</td>
              <td>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] ${
                    status === "Finished"
                      ? "bg-lime-500/20 text-lime-300"
                      : "bg-cyan-500/20 text-cyan-300"
                  }`}
                >
                  {status}
                </span>
              </td>
              <td className="font-mono">{formatDuration(player.penaltyTime)}</td>
              <td className="font-mono">{formatDuration(player.playingTime)}</td>
              <td className="font-mono">{formatDuration(player.totalTime)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
