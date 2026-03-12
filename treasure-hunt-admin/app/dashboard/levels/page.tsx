"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { getLevels } from "@/src/services/levelService";
import LevelTable from "@/src/components/LevelTable";
import LevelForm from "@/src/components/LevelForm";
import { getErrorMessage } from "@/src/lib/httpError";
import { Level } from "@/src/types";

export default function LevelsPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLevels = async () => {
    try {
      const data = await getLevels();
      setLevels(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to fetch levels."));
    }
  };

  useEffect(() => {
    const loadLevels = async () => {
      try {
        const data = await getLevels();
        setLevels(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to fetch levels."));
      } finally {
        setIsLoading(false);
      }
    };

    loadLevels();
  }, []);

  return (
    <div className="space-y-6 fade-in">
      <h1 className="text-2xl font-bold text-[#1f1d1a]">Level Management</h1>

      <div className="panel p-5">
        <LevelForm
          fetchLevels={fetchLevels}
          selectedLevel={selectedLevel}
          setSelectedLevel={setSelectedLevel}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading levels...</p>
      ) : (
        <div className="panel overflow-x-auto p-4">
          <LevelTable
            levels={levels}
            fetchLevels={fetchLevels}
            setSelectedLevel={setSelectedLevel}
          />
        </div>
      )}
    </div>
  );
}
