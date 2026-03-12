"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { deleteLevel } from "@/src/services/levelService";
import { getErrorMessage } from "@/src/lib/httpError";
import { Level } from "@/src/types";

type Props = {
  levels: Level[];
  fetchLevels: () => void;
  setSelectedLevel: (level: Level | null) => void;
};

export default function LevelTable({
  levels,
  fetchLevels,
  setSelectedLevel,
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    if (!confirm("Delete this level?")) return;

    try {
      setDeletingId(id);
      await deleteLevel(id);
      await fetchLevels();
      toast.success("Level deleted.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete level."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Level</th>
          <th>Question</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {!levels.length ? (
          <tr>
            <td colSpan={3} className="text-center text-[#5a564e]">
              No levels found.
            </td>
          </tr>
        ) : null}

        {levels.map((level) => (
          <tr key={level._id} className="transition hover:bg-[#f0ede4]/60">
            <td className="font-semibold">{level.levelNumber}</td>

            <td>{level.question}</td>

            <td className="space-x-2">
              <button
                onClick={() => setSelectedLevel(level)}
                disabled={Boolean(deletingId)}
                className="btn btn-info text-sm"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(level._id)}
                disabled={Boolean(deletingId)}
                className="btn btn-danger text-sm"
              >
                {deletingId === level._id ? "Deleting..." : "Delete"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
