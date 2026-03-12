import bcrypt from "bcrypt";
import Level from "../models/level.model";
import User from "../models/user.model";
import { GameConfig } from "../models/gameConfig.model";
import { emitSocket } from "../realtime/socket";
import { createActivity } from "./activity.service";
import { getLeaderboardService } from "./leaderboard.service";
import {
  ensureUserLevelOrder,
  getMappedLevelNumber,
} from "./levelOrder.service";
import { runWithOptionalTransaction } from "./transaction.service";

type SubmitAnswerResult = {
  statusCode: number;
  body: Record<string, unknown>;
};

type ServiceExecution = {
  result: SubmitAnswerResult;
  postCommitActions: Array<() => Promise<void>>;
};

export const submitAnswerService = async (
  user: any,
  answer: string,
): Promise<SubmitAnswerResult> => {
  const config = await GameConfig.findById("game-config");
  if (!config || config.status !== "active") {
    return {
      statusCode: 403,
      body: {
        message: "Game is not currently active",
        status: "inactive",
      },
    };
  }

  const normalizedAnswer = answer.toLowerCase().trim();
  if (!normalizedAnswer) {
    return {
      statusCode: 400,
      body: {
        message: "Answer is required",
      },
    };
  }

  const execution = await runWithOptionalTransaction<ServiceExecution>(
    async (session) => {
    const userQuery = User.findById(user._id);
    if (session) {
      userQuery.session(session);
    }
    const currentUser = await userQuery;

    if (!currentUser) {
      return {
        result: {
          statusCode: 401,
          body: { message: "Not authorized, user not found" },
        },
        postCommitActions: [],
      };
    }

    if (!currentUser.gameStartedAt) {
      currentUser.gameStartedAt = new Date();
    }

    if (currentUser.lockedUntil && currentUser.lockedUntil > new Date()) {
      return {
        result: {
          statusCode: 403,
          body: { message: "All Lives Lost! Wait for restoration" },
        },
        postCommitActions: [],
      };
    }

    if (!currentUser.locationUnlocked) {
      return {
        result: {
          statusCode: 403,
          body: {
            message: "Scan the location QR before answering",
            locationLocked: true,
          },
        },
        postCommitActions: [],
      };
    }

    const levelOrder = await ensureUserLevelOrder(currentUser, session);
    const mappedLevelNumber = getMappedLevelNumber(currentUser, levelOrder);
    if (!mappedLevelNumber) {
      return {
        result: {
          statusCode: 404,
          body: { message: "Level not found" },
        },
        postCommitActions: [],
      };
    }

    const levelQuery = Level.findOne({ levelNumber: mappedLevelNumber });
    if (session) {
      levelQuery.session(session);
    }
    const level = await levelQuery;
    if (!level) {
      return {
        result: {
          statusCode: 404,
          body: { message: "Level not found" },
        },
        postCommitActions: [],
      };
    }

    const postCommitActions: Array<() => Promise<void>> = [];
    const isCorrect = await bcrypt.compare(normalizedAnswer, level.answerHash);

    if (!isCorrect) {
      currentUser.wrongAttempts = (currentUser.wrongAttempts || 0) + 1;

      if (currentUser.wrongAttempts >= 3) {
        currentUser.penaltyTime += 120;
        currentUser.lockedUntil = new Date(Date.now() + 10000);
        currentUser.wrongAttempts = 0;

        if (session) {
          await currentUser.save({ session });
        } else {
          await currentUser.save();
        }

        postCommitActions.push(async () => {
          const leaderboard = await getLeaderboardService();
          emitSocket("leaderboard:update", leaderboard);
        });
        postCommitActions.push(async () => {
          await createActivity(
            "LOST_LIFE",
            `${currentUser.username} lost all lives at level ${level.levelNumber}`,
            currentUser.username,
            level.levelNumber,
          );
          emitSocket("activity:update", {
            message: `${currentUser.username} lost all lives at level ${level.levelNumber}`,
          });
        });

        return {
          result: {
            statusCode: 200,
            body: {
              correct: false,
              message:
                "3 wrong attempts. 2 minute penalty applied. Try again in 10 seconds.",
              WrongAttempts: currentUser.wrongAttempts,
            },
          },
          postCommitActions,
        };
      }

      if (session) {
        await currentUser.save({ session });
      } else {
        await currentUser.save();
      }

      postCommitActions.push(async () => {
        await createActivity(
          "INCORRECT_ANSWER",
          `${currentUser.username} provided an incorrect answer for level ${level.levelNumber}`,
          currentUser.username,
          level.levelNumber,
        );
        emitSocket("activity:update", {
          message: `${currentUser.username} provided an incorrect answer for level ${level.levelNumber}`,
        });
      });

      return {
        result: {
          statusCode: 200,
          body: {
            correct: false,
            message: "Incorrect answer",
          },
        },
        postCommitActions,
      };
    }

    currentUser.currentLevel += 1;
    currentUser.locationUnlocked = false;
    currentUser.wrongAttempts = 0;

    const nextMappedLevelNumber = getMappedLevelNumber(currentUser, levelOrder);
    let nextLevel = null;
    if (nextMappedLevelNumber) {
      const nextLevelQuery = Level.findOne({ levelNumber: nextMappedLevelNumber });
      if (session) {
        nextLevelQuery.session(session);
      }
      nextLevel = await nextLevelQuery;
    }

    if (!nextLevel) {
      currentUser.gameCompletedAt = new Date();
      postCommitActions.push(async () => {
        await createActivity(
          "COMPLETED_LEVEL",
          `${currentUser.username} Completed game`,
          currentUser.username,
        );
        emitSocket("activity:update", {
          message: `${currentUser.username} completed the game`,
        });
      });
    }

    if (session) {
      await currentUser.save({ session });
    } else {
      await currentUser.save();
    }
    postCommitActions.push(async () => {
      const leaderboard = await getLeaderboardService();
      emitSocket("leaderboard:update", leaderboard);
    });

    if (!nextLevel) {
      return {
        result: {
          statusCode: 200,
          body: {
            gameCompleted: true,
            message: "Congratulations! You completed the treasure hunt!",
          },
        },
        postCommitActions,
      };
    }

    postCommitActions.push(async () => {
      await createActivity(
        "LEVEL_COMPLETED",
        `${currentUser.username} completed level ${level.levelNumber}`,
        currentUser.username,
        level.levelNumber,
      );
      emitSocket("activity:update", {
        message: `${currentUser.username} completed level ${level.levelNumber}`,
      });
      emitSocket("player:update", {
        userId: currentUser._id,
        username: currentUser.username,
        currentLevel: currentUser.currentLevel,
        wrongAttempts: currentUser.wrongAttempts,
        gameCompletedAt: currentUser.gameCompletedAt,
      });
    });

    return {
      result: {
        statusCode: 200,
        body: {
          correct: true,
          levelNumber: nextLevel.levelNumber,
          question: nextLevel.question,
          hint: nextLevel.hint,
        },
      },
      postCommitActions,
    };
    },
  );

  for (const action of execution.postCommitActions) {
    await action();
  }

  return execution.result;
};

export const unlockLocationService = async (
  user: any,
  qrCode: string,
): Promise<SubmitAnswerResult> => {
  if (!qrCode || !qrCode.trim()) {
    return {
      statusCode: 400,
      body: {
        message: "QR code is required",
      },
    };
  }

  const config = await GameConfig.findById("game-config");
  if (!config || config.status !== "active") {
    return {
      statusCode: 403,
      body: {
        message: "Game is not currently active",
        status: "inactive",
      },
    };
  }

  const execution = await runWithOptionalTransaction<ServiceExecution>(
    async (session) => {
      const userQuery = User.findById(user._id);
      if (session) {
        userQuery.session(session);
      }
      const currentUser = await userQuery;

      if (!currentUser) {
        return {
          result: {
            statusCode: 401,
            body: { message: "Not authorized, user not found" },
          },
          postCommitActions: [],
        };
      }

      if (currentUser.gameCompletedAt) {
        return {
          result: {
            statusCode: 400,
            body: { message: "You have already completed the game" },
          },
          postCommitActions: [],
        };
      }

      if (currentUser.locationUnlocked) {
        return {
          result: {
            statusCode: 400,
            body: { message: "Location already unlocked" },
          },
          postCommitActions: [],
        };
      }

      const levelOrder = await ensureUserLevelOrder(currentUser, session);
      const mappedLevelNumber = getMappedLevelNumber(currentUser, levelOrder);
      if (!mappedLevelNumber) {
        return {
          result: {
            statusCode: 404,
            body: { message: "Level not found" },
          },
          postCommitActions: [],
        };
      }

      const levelQuery = Level.findOne({ levelNumber: mappedLevelNumber });
      if (session) {
        levelQuery.session(session);
      }
      const level = await levelQuery;
      if (!level) {
        return {
          result: {
            statusCode: 404,
            body: { message: "Level not found" },
          },
          postCommitActions: [],
        };
      }

      if (qrCode !== level.qrCode) {
        return {
          result: {
            statusCode: 400,
            body: { message: "Invalid QR code" },
          },
          postCommitActions: [],
        };
      }

      currentUser.locationUnlocked = true;
      if (session) {
        await currentUser.save({ session });
      } else {
        await currentUser.save();
      }

      const postCommitActions: Array<() => Promise<void>> = [];
      postCommitActions.push(async () => {
        await createActivity(
          "LOCATION_UNLOCKED",
          `${currentUser.username} unlocked location for level ${level.levelNumber}`,
          currentUser.username,
          level.levelNumber,
        );
        emitSocket("activity:update", {
          message: `${currentUser.username} unlocked location for level ${level.levelNumber}`,
        });
      });

      return {
        result: {
          statusCode: 200,
          body: {
            message: "Location verified. Question unlocked.",
          },
        },
        postCommitActions,
      };
    },
  );

  for (const action of execution.postCommitActions) {
    await action();
  }

  return execution.result;
};
