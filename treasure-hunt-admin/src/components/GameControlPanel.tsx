"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  startGame,
  endGame,
  resetGame,
  getGameStatus,
} from "@/src/services/adminGameService";
import { socket } from "@/src/services/socket";
import { getErrorMessage } from "@/src/lib/httpError";

type Status = "waiting" | "inactive" | "active" | "finished";
type ActionType = "start" | "end" | "reset" | null;

export default function GameControlPanel() {
  const [status, setStatus] = useState<Status>("waiting");
  const [pendingAction, setPendingAction] = useState<ActionType>(null);
  const [confirmAction, setConfirmAction] = useState<ActionType>(null);
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getGameStatus();
        setStatus(data.status);
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to fetch game status."));
      }
    };

    fetchStatus();

    const onStatusUpdate = (newStatus: Status) => {
      setStatus(newStatus);
    };

    socket.on("game:status", onStatusUpdate);

    return () => {
      socket.off("game:status", onStatusUpdate);
    };
  }, []);

  const handleOpenConfirm = (action: ActionType) => {
    if (pendingAction) return;
    setConfirmAction(action);
    setConfirmationPassword("");
  };

  const closeConfirm = () => {
    if (isConfirming) return;
    setConfirmAction(null);
    setConfirmationPassword("");
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;

    if (!confirmationPassword.trim()) {
      toast.error("Password is required.");
      return;
    }

    setPendingAction(confirmAction);
    setIsConfirming(true);

    try {
      if (confirmAction === "start") {
        await startGame(confirmationPassword);
        toast.success("Game started.");
      }

      if (confirmAction === "end") {
        await endGame(confirmationPassword);
        toast.success("Game ended.");
      }

      if (confirmAction === "reset") {
        await resetGame(confirmationPassword);
        toast.success("Game reset completed.");
      }

      closeConfirm();
    } catch (error) {
      toast.error(getErrorMessage(error, "Action failed. Please check your password."));
    } finally {
      setIsConfirming(false);
      setPendingAction(null);
    }
  };

  return (
    <div className="panel rise-in space-y-4 p-6">
      <h2 className="text-xl font-bold">Game Control Panel</h2>

      <div className="flex items-center gap-3">
        <span className="font-semibold text-[#1f1d1a]">Game Status:</span>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white ${
            status === "active"
              ? "bg-emerald-600"
              : status === "finished"
                ? "bg-red-600"
                : "bg-slate-500"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="flex w-full flex-col gap-6 mt-6">
        <button
          onClick={() => handleOpenConfirm("start")}
          disabled={Boolean(pendingAction) || status === "active"}
          className="btn btn-primary w-full"
        >
          {pendingAction === "start" ? "Starting..." : "Start Game"}
        </button>

        <button
          onClick={() => handleOpenConfirm("end")}
          disabled={Boolean(pendingAction) || status !== "active"}
          className="btn btn-warn w-full"
        >
          {pendingAction === "end" ? "Ending..." : "End Game"}
        </button>

        <button
          onClick={() => handleOpenConfirm("reset")}
          disabled={Boolean(pendingAction)}
          className="btn btn-danger w-full"
        >
          {pendingAction === "reset" ? "Resetting..." : "Reset Game"}
        </button>
      </div>

      {confirmAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="panel w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-2">
              Confirm {confirmAction === "start" ? "Start Game" : confirmAction === "end" ? "End Game" : "Reset Game"}
            </h3>
            <p className="mb-4 text-sm text-slate-600">
              Enter your admin password to confirm this action.
            </p>
            <input
              type="password"
              placeholder="Password"
              className="input w-full mb-4"
              value={confirmationPassword}
              onChange={(e) => setConfirmationPassword(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirm}
                className="btn btn-outline"
                disabled={isConfirming}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className="btn btn-info"
                disabled={isConfirming}
              >
                {isConfirming ? "Confirming..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
