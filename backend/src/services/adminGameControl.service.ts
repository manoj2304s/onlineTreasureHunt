import { GameConfig } from "../models/gameConfig.model";
import User from "../models/user.model";
import { emitSocket } from "../realtime/socket";
import { runWithOptionalTransaction } from "./transaction.service";

type AdminControlResult = {
  statusCode: number;
  body: Record<string, unknown>;
};

type AdminControlExecution = {
  result: AdminControlResult;
  postCommitActions: Array<() => Promise<void>>;
};

export const startGameService = async (): Promise<AdminControlResult> => {
  const execution = await runWithOptionalTransaction<AdminControlExecution>(
    async (session) => {
      const configQuery = GameConfig.findById("game-config");
      if (session) {
        configQuery.session(session);
      }
      const existingConfig = await configQuery;

      if (existingConfig && existingConfig.status === "active") {
        return {
          result: {
            statusCode: 400,
            body: { message: "Game already started" },
          },
          postCommitActions: [],
        };
      }

      const updateQuery = GameConfig.findByIdAndUpdate(
        "game-config",
        {
          status: "active",
          startedAt: new Date(),
          endedAt: null,
        },
        {
          upsert: true,
          returnDocument: "after",
          setDefaultsOnInsert: true,
        },
      );
      if (session) {
        updateQuery.session(session);
      }
      const config = await updateQuery;

      return {
        result: {
          statusCode: 200,
          body: {
            message: "Game started successfully",
            startedAt: config?.startedAt,
          },
        },
        postCommitActions: [
          async () => {
            emitSocket("game:status", "active");
          },
        ],
      };
    },
  );

  for (const action of execution.postCommitActions) {
    await action();
  }

  return execution.result;
};

export const endGameService = async (): Promise<AdminControlResult> => {
  const execution = await runWithOptionalTransaction<AdminControlExecution>(
    async (session) => {
      const configQuery = GameConfig.findById("game-config");
      if (session) {
        configQuery.session(session);
      }
      const config = await configQuery;

      if (!config || config.status !== "active") {
        return {
          result: {
            statusCode: 400,
            body: { message: "Game is not active" },
          },
          postCommitActions: [],
        };
      }

      const updateQuery = GameConfig.findByIdAndUpdate(
        "game-config",
        {
          status: "finished",
          endedAt: new Date(),
        },
        {
          returnDocument: "after",
        },
      );
      if (session) {
        updateQuery.session(session);
      }
      const updatedConfig = await updateQuery;

      return {
        result: {
          statusCode: 200,
          body: {
            message: "Game ended successfully",
            endedAt: updatedConfig?.endedAt,
          },
        },
        postCommitActions: [
          async () => {
            emitSocket("game:status", "finished");
          },
        ],
      };
    },
  );

  for (const action of execution.postCommitActions) {
    await action();
  }

  return execution.result;
};

export const resetGameService = async (): Promise<AdminControlResult> => {
  const execution = await runWithOptionalTransaction<AdminControlExecution>(
    async (session) => {
      const userUpdate = User.updateMany(
        {},
        {
          $set: {
            currentLevel: 1,
            wrongAttempts: 0,
            lockedUntil: null,
            locationUnlocked: true,
            gameStartedAt: null,
            gameCompletedAt: null,
            penaltyTime: 0,
            hintUsedLevels: [],
          },
        },
      );
      if (session) {
        userUpdate.session(session);
      }
      await userUpdate;

      const configUpdate = GameConfig.updateOne(
        {},
        {
          $set: {
            status: "inactive",
            startedAt: null,
            endedAt: null,
          },
        },
      );
      if (session) {
        configUpdate.session(session);
      }
      await configUpdate;

      return {
        result: {
          statusCode: 200,
          body: {
            message: "Game reset successfully",
          },
        },
        postCommitActions: [
          async () => {
            emitSocket("game:status", "inactive");
          },
        ],
      };
    },
  );

  for (const action of execution.postCommitActions) {
    await action();
  }

  return execution.result;
};
