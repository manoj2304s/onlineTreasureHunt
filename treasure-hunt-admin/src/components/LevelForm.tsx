"use client";

import { useState, useEffect } from "react";
import { createLevel, updateLevel } from "@/src/services/levelService";
import { Level } from "@/src/types";

type Props = {
  fetchLevels: () => void;
  selectedLevel: Level | null;
  setSelectedLevel: (level: Level | null) => void;
};

export default function LevelForm({
  fetchLevels,
  selectedLevel,
  setSelectedLevel,
}: Props) {
  const [levelNumber, setLevelNumber] = useState<number | "">("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [latitude, setLatitude] = useState<number | "">("");
  const [longitude, setLongitude] = useState<number | "">("");

  useEffect(() => {
    if (!selectedLevel) return;

    const timer = setTimeout(() => {
      setLevelNumber(selectedLevel.levelNumber);
      setQuestion(selectedLevel.question);
      setAnswer("");
      setHint(selectedLevel.hint || "");
      setQrCode(selectedLevel.qrCode);
      setLatitude(selectedLevel.location.latitude);
      setLongitude(selectedLevel.location.longitude);
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedLevel]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      levelNumber: Number(levelNumber),
      question,
      answer,
      hint,
      qrCode,
      location: {
        latitude: Number(latitude),
        longitude: Number(longitude),
      },
    };

    if (selectedLevel) {
      await updateLevel(selectedLevel._id, payload);
    } else {
      await createLevel(payload);
    }

    setLevelNumber("");
    setQuestion("");
    setAnswer("");
    setHint("");
    setQrCode("");
    setLatitude("");
    setLongitude("");
    setSelectedLevel(null);

    fetchLevels();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="number"
        placeholder="Level Number"
        value={levelNumber}
        onChange={(e) => setLevelNumber(Number(e.target.value))}
        className="border p-2 w-full"
      />

      <input
        placeholder="Question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="border p-2 w-full"
      />

      <input
        placeholder="Answer"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="border p-2 w-full"
      />

      <input
        placeholder="Hint"
        value={hint}
        onChange={(e) => setHint(e.target.value)}
        className="border p-2 w-full"
      />

      <input
        placeholder="QR Code"
        value={qrCode}
        onChange={(e) => setQrCode(e.target.value)}
        className="border p-2 w-full"
      />

      <input
        placeholder="Latitude"
        value={latitude}
        onChange={(e) => setLatitude(Number(e.target.value))}
        className="border p-2 w-full"
      />

      <input
        placeholder="Longitude"
        value={longitude}
        onChange={(e) => setLongitude(Number(e.target.value))}
        className="border p-2 w-full"
      />

      <button className="bg-green-600 text-white px-4 py-2 rounded">
        {selectedLevel ? "Update Level" : "Create Level"}
      </button>
    </form>
  );
}
