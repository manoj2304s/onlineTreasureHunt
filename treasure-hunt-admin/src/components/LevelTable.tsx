"use client";

import { deleteLevel } from "@/src/services/levelService";
import {Level} from "@/src/types";

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
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this level?")) return;

    await deleteLevel(id);
    fetchLevels();
  };

  return (
    <table className="w-full border">
      <thead>
        <tr className="bg-gray-100 text-black">
          <th className="p-2">Level</th>
          <th className="p-2">Question</th>
          <th className="p-2">Actions</th>
        </tr>
      </thead>

      <tbody>
        {levels.map((level) => (
          <tr key={level._id} className="border-t">
            <td className="p-2">{level.levelNumber}</td>

            <td className="p-2">{level.question}</td>

            <td className="p-2 space-x-2">
              <button
                onClick={() => setSelectedLevel(level)}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(level._id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
