import assert from "node:assert/strict";

const run = async () => {
  const transactionModule = await import("../services/transaction.service");
  const gameConfigModule = await import("../models/gameConfig.model");
  const userModule = await import("../models/user.model");
  const levelModule = await import("../models/level.model");
  const levelOrderModule = await import("../services/levelOrder.service");
  const realtimeModule = await import("../realtime/socket");
  const activityServiceModule = await import("../services/activity.service");
  const leaderboardServiceModule = await import("../services/leaderboard.service");
  const bcryptModule = await import("bcrypt");

  const originalRunWithOptionalTransaction =
    transactionModule.runWithOptionalTransaction;
  const originalFindById = gameConfigModule.GameConfig.findById;
  const originalFindByIdAndUpdate = gameConfigModule.GameConfig.findByIdAndUpdate;
  const originalUpdateOne = gameConfigModule.GameConfig.updateOne;
  const originalUserFindById = userModule.default.findById;
  const originalUserUpdateMany = userModule.default.updateMany;
  const originalLevelFindOne = levelModule.default.findOne;
  const originalEnsureUserLevelOrder = levelOrderModule.ensureUserLevelOrder;
  const originalGetMappedLevelNumber = levelOrderModule.getMappedLevelNumber;
  const originalEmitSocket = realtimeModule.emitSocket;
  const originalCreateActivity = activityServiceModule.createActivity;
  const originalGetLeaderboardService =
    leaderboardServiceModule.getLeaderboardService;

  (transactionModule as any).runWithOptionalTransaction = async (operation: any) =>
    operation(null);

  const adminGameControlService = await import(
    "../services/adminGameControl.service"
  );
  const gameplayService = await import("../services/gameplay.service");

  try {
    (gameConfigModule.GameConfig.findById as any) = async () => ({
      status: "active",
    });
    const startActive = await adminGameControlService.startGameService();
    assert.equal(startActive.statusCode, 400);
    assert.equal(startActive.body.message, "Game already started");

    (gameConfigModule.GameConfig.findById as any) = async () => ({
      status: "inactive",
    });
    (gameConfigModule.GameConfig.findByIdAndUpdate as any) = async () => ({
      startedAt: new Date("2026-01-01T10:00:00.000Z"),
    });
    const startSuccess = await adminGameControlService.startGameService();
    assert.equal(startSuccess.statusCode, 200);
    assert.equal(startSuccess.body.message, "Game started successfully");

    (gameConfigModule.GameConfig.findById as any) = async () => ({
      status: "inactive",
    });
    const endInactive = await adminGameControlService.endGameService();
    assert.equal(endInactive.statusCode, 400);
    assert.equal(endInactive.body.message, "Game is not active");

    (gameConfigModule.GameConfig.findById as any) = async () => ({
      status: "active",
    });
    (gameConfigModule.GameConfig.findByIdAndUpdate as any) = async () => ({
      endedAt: new Date("2026-01-01T12:00:00.000Z"),
    });
    const endSuccess = await adminGameControlService.endGameService();
    assert.equal(endSuccess.statusCode, 200);
    assert.equal(endSuccess.body.message, "Game ended successfully");

    (userModule.default.updateMany as any) = async () => ({ acknowledged: true });
    (gameConfigModule.GameConfig.updateOne as any) = async () => ({
      acknowledged: true,
    });
    const resetResult = await adminGameControlService.resetGameService();
    assert.equal(resetResult.statusCode, 200);
    assert.equal(resetResult.body.message, "Game reset successfully");

    (gameConfigModule.GameConfig.findById as any) = async () => ({
      status: "inactive",
    });
    const inactiveSubmit = await gameplayService.submitAnswerService(
      { _id: "user1" },
      "answer",
    );
    assert.equal(inactiveSubmit.statusCode, 403);

    (gameConfigModule.GameConfig.findById as any) = async () => ({
      status: "active",
    });
    const emptySubmit = await gameplayService.submitAnswerService(
      { _id: "user1" },
      "   ",
    );
    assert.equal(emptySubmit.statusCode, 400);

    (realtimeModule as any).emitSocket = () => {};
    (activityServiceModule as any).createActivity = async () => ({});
    (leaderboardServiceModule as any).getLeaderboardService = async () => [];
    (levelOrderModule as any).ensureUserLevelOrder = async () => [1];
    (levelOrderModule as any).getMappedLevelNumber = (currentUser: any) =>
      currentUser.currentLevel === 1 ? 1 : null;
    const answerHash = await bcryptModule.hash("correct-answer", 10);
    (levelModule.default.findOne as any) = async () => ({
      levelNumber: 1,
      answerHash,
      question: "Q1",
      hint: "H1",
      qrCode: "QR-1",
    });

    const unlockedUser = {
      _id: "unlock-user",
      username: "player",
      gameCompletedAt: null,
      locationUnlocked: false,
      currentLevel: 1,
      save: async () => {},
    };
    (userModule.default.findById as any) = async () => unlockedUser;
    const unlockSuccess = await gameplayService.unlockLocationService(
      { _id: "unlock-user" },
      "QR-1",
    );
    assert.equal(unlockSuccess.statusCode, 200);
    assert.equal(unlockSuccess.body.message, "Location verified. Question unlocked.");

    const answerUser = {
      _id: "answer-user",
      username: "player",
      gameStartedAt: null,
      gameCompletedAt: null,
      locationUnlocked: true,
      lockedUntil: null,
      wrongAttempts: 0,
      penaltyTime: 0,
      currentLevel: 1,
      save: async () => {},
    };
    (userModule.default.findById as any) = async () => answerUser;
    const submitSuccess = await gameplayService.submitAnswerService(
      { _id: "answer-user" },
      "correct-answer",
    );
    assert.equal(submitSuccess.statusCode, 200);
    assert.equal(submitSuccess.body.gameCompleted, true);

    const missingQrUnlock = await gameplayService.unlockLocationService(
      { _id: "user1" },
      "",
    );
    assert.equal(missingQrUnlock.statusCode, 400);

    console.log("service.logic.test: PASS");
  } finally {
    (transactionModule as any).runWithOptionalTransaction =
      originalRunWithOptionalTransaction;
    (gameConfigModule.GameConfig.findById as any) = originalFindById;
    (gameConfigModule.GameConfig.findByIdAndUpdate as any) = originalFindByIdAndUpdate;
    (gameConfigModule.GameConfig.updateOne as any) = originalUpdateOne;
    (userModule.default.findById as any) = originalUserFindById;
    (userModule.default.updateMany as any) = originalUserUpdateMany;
    (levelModule.default.findOne as any) = originalLevelFindOne;
    (levelOrderModule as any).ensureUserLevelOrder = originalEnsureUserLevelOrder;
    (levelOrderModule as any).getMappedLevelNumber = originalGetMappedLevelNumber;
    (realtimeModule as any).emitSocket = originalEmitSocket;
    (activityServiceModule as any).createActivity = originalCreateActivity;
    (leaderboardServiceModule as any).getLeaderboardService =
      originalGetLeaderboardService;
  }
};

run().catch((error) => {
  console.error("service.logic.test: FAIL", error);
  process.exit(1);
});
