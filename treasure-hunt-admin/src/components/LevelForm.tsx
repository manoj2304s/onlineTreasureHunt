"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { createLevel, updateLevel } from "@/src/services/levelService";
import { getErrorMessage } from "@/src/lib/httpError";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const resetForm = () => {
    setLevelNumber("");
    setQuestion("");
    setAnswer("");
    setHint("");
    setQrCode("");
    setLatitude("");
    setLongitude("");
    setSelectedLevel(null);
  };

  const validateCreatePayload = () => {
    if (!Number.isInteger(levelNumber) || Number(levelNumber) <= 0) {
      toast.error("Level number must be a positive integer.");
      return false;
    }

    if (!question.trim()) {
      toast.error("Question is required.");
      return false;
    }

    if (!answer.trim()) {
      toast.error("Answer is required.");
      return false;
    }

    if (!qrCode.trim()) {
      toast.error("QR code is required.");
      return false;
    }

    if (
      !Number.isFinite(Number(latitude)) ||
      Number(latitude) < -90 ||
      Number(latitude) > 90
    ) {
      toast.error("Latitude must be between -90 and 90.");
      return false;
    }

    if (
      !Number.isFinite(Number(longitude)) ||
      Number(longitude) < -180 ||
      Number(longitude) > 180
    ) {
      toast.error("Longitude must be between -180 and 180.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      if (selectedLevel) {
        const payload: { question?: string; hint?: string; answer?: string } = {};

        if (question.trim() !== selectedLevel.question.trim()) {
          payload.question = question.trim();
        }

        if ((hint || "").trim() !== (selectedLevel.hint || "").trim()) {
          payload.hint = hint.trim();
        }

        if (answer.trim()) {
          payload.answer = answer.trim();
        }

        if (!Object.keys(payload).length) {
          toast.error("Update at least one field.");
          return;
        }

        await updateLevel(selectedLevel._id, payload);
        toast.success("Level updated.");
      } else {
        if (!validateCreatePayload()) {
          return;
        }

        await createLevel({
          levelNumber: Number(levelNumber),
          question: question.trim(),
          answer: answer.trim(),
          hint: hint.trim(),
          qrCode: qrCode.trim(),
          location: {
            latitude: Number(latitude),
            longitude: Number(longitude),
          },
        });
        toast.success("Level created.");
      }

      resetForm();
      await fetchLevels();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="number"
        placeholder="Level Number"
        value={levelNumber}
        onChange={(e) =>
          setLevelNumber(e.target.value === "" ? "" : Number(e.target.value))
        }
        disabled={Boolean(selectedLevel) || isSubmitting}
        className="input"
      />

      <input
        placeholder="Question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        disabled={isSubmitting}
        className="input"
      />

      <input
        placeholder="Answer"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={isSubmitting}
        className="input"
      />

      <input
        placeholder="Hint"
        value={hint}
        onChange={(e) => setHint(e.target.value)}
        disabled={isSubmitting}
        className="input"
      />

      <input
        placeholder="QR Code"
        value={qrCode}
        onChange={(e) => setQrCode(e.target.value)}
        disabled={Boolean(selectedLevel) || isSubmitting}
        className="input"
      />

      <input
        type="number"
        step="any"
        placeholder="Latitude"
        value={latitude}
        onChange={(e) =>
          setLatitude(e.target.value === "" ? "" : Number(e.target.value))
        }
        disabled={Boolean(selectedLevel) || isSubmitting}
        className="input"
      />

      <input
        type="number"
        step="any"
        placeholder="Longitude"
        value={longitude}
        onChange={(e) =>
          setLongitude(e.target.value === "" ? "" : Number(e.target.value))
        }
        disabled={Boolean(selectedLevel) || isSubmitting}
        className="input"
      />

      <div className="flex gap-3">
        <button
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting
            ? "Saving..."
            : selectedLevel
              ? "Update Level"
              : "Create Level"}
        </button>

        {selectedLevel ? (
          <button
            type="button"
            onClick={resetForm}
            disabled={isSubmitting}
            className="btn btn-neutral"
          >
            Cancel Edit
          </button>
        ) : null}
      </div>

      {selectedLevel ? (
        <p className="text-xs text-[color:var(--foreground-muted)]">
          Editing updates question/hint/answer only. Level number, QR code, and
          location are locked.
        </p>
      ) : null}

      {!selectedLevel ? (
        <p className="text-xs text-[color:var(--foreground-muted)]">
          Latitude range: -90 to 90, Longitude range: -180 to 180.
        </p>
      ) : null}

      {!selectedLevel ? null : (
        <p className="text-xs text-[color:var(--foreground-muted)]">
          Leave answer blank to keep the current answer unchanged.
        </p>
      )}
    </form>
  );
}
