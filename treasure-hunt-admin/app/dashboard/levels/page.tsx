"use client";

import { useEffect, useState } from "react";
import { getLevels } from "@/src/services/levelService";
import LevelTable from "@/src/components/LevelTable";
import LevelForm from "@/src/components/LevelForm";
import {Level} from "@/src/types";

export default function LevelsPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);

  const fetchLevels = async () => {
    const data = await getLevels();
    setLevels(data);
  };

  useEffect(() => {
    const loadLevels = async () => {
      const data = await getLevels();
      setLevels(data);
    };

    loadLevels();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Level Management</h1>

      <LevelForm
        fetchLevels={fetchLevels}
        selectedLevel={selectedLevel}
        setSelectedLevel={setSelectedLevel}
      />

      <LevelTable
        levels={levels}
        fetchLevels={fetchLevels}
        setSelectedLevel={setSelectedLevel}
      />
    </div>
  );
}
