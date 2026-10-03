import assert from "node:assert/strict";
import mongoose from "mongoose";
import request from "supertest";
import bcrypt from "bcrypt";
import { MongoMemoryServer } from "mongodb-memory-server";
import { runStandalone, skip } from "./harness";

/**
 * Covers the hint economy:
 *   1. GET /gameplay/current-level must not leak the hint (it is paid content).
 *   2. GET /gameplay/hint applies a 300s penalty and records the level.
 *   3. Repeating the request on the same level returns the hint again but does
 *      not charge twice — the behaviour `getHint` implements via hintUsedLevels.
 */
export const run = async () => {
  if (process.env.RUN_INTEGRATION_TESTS !== "true") {
    skip("needs a database; re-run with RUN_INTEGRATION_TESTS=true");
  }

  let mongo: MongoMemoryServer | null = null;
  let dbUrl = process.env.TEST_DB_URL;

  if (!dbUrl) {
    try {
      mongo = await MongoMemoryServer.create();
      dbUrl = mongo.getUri();
    } catch (error: any) {
      if (error?.code === "EPERM") {
        skip("mongodb-memory-server could not spawn a binary (EPERM)");
      }
      throw error;
    }
  }

  process.env.DB_URL = dbUrl;
  await mongoose.connect(process.env.DB_URL);

  const app = (await import("../app")).default;
  const User = (await import("../models/user.model")).default;
  const Level = (await import("../models/level.model")).default;
  const { GameConfig } = await import("../models/gameConfig.model");

  const QUESTION = "What has keys but opens no locks?";
  const HINT = "You play it with your fingers.";

  try {
    await Promise.all([
      Level.deleteMany({}),
      User.deleteMany({}),
      GameConfig.deleteMany({}),
    ]);

    await GameConfig.create({
      _id: "game-config",
      status: "active",
      startedAt: new Date(),
    });

    await Level.create({
      levelNumber: 1,
      question: QUESTION,
      answerHash: await bcrypt.hash("piano", 10),
      hint: HINT,
      qrCode: "QR-LEVEL-1",
      location: { latitude: 13.0254172, longitude: 76.1123468 },
    });

    const unique = Date.now();
    const payload = {
      username: `hint_${unique}`,
      email: `hint_${unique}@mail.com`,
      password: "secret123",
    };

    const registered = await request(app).post("/auth/register").send(payload);
    assert.equal(registered.status, 201);

    const loggedIn = await request(app)
      .post("/auth/login")
      .send({ email: payload.email, password: payload.password });
    assert.equal(loggedIn.status, 200);
    const auth = { Authorization: `Bearer ${loggedIn.body.token as string}` };

    // 1. the question is served, the hint is not
    const current = await request(app).get("/gameplay/current-level").set(auth);
    assert.equal(current.status, 200);
    assert.equal(current.body.question, QUESTION);
    assert.equal(
      current.body.hint,
      undefined,
      "current-level must not expose the hint — it is paid for via /gameplay/hint",
    );

    // 2. first request: hint returned, penalty applied, level recorded
    const first = await request(app).get("/gameplay/hint").set(auth);
    assert.equal(first.status, 200);
    assert.equal(first.body.hint, HINT);
    assert.equal(first.body.penaltyApplied, true);

    const afterFirst = await User.findOne({ email: payload.email });
    assert.equal(afterFirst?.penaltyTime, 300, "first hint must cost 300 seconds");
    assert.deepEqual(
      [...(afterFirst?.hintUsedLevels ?? [])],
      [1],
      "the hinted level must be recorded",
    );

    // 3. repeat on the same level: still served, but charged only once
    const second = await request(app).get("/gameplay/hint").set(auth);
    assert.equal(second.status, 200);
    assert.equal(second.body.hint, HINT, "a re-request still returns the hint");
    assert.equal(
      second.body.penaltyApplied,
      false,
      "a repeat request must report that no new penalty was applied",
    );

    const afterSecond = await User.findOne({ email: payload.email });
    assert.equal(
      afterSecond?.penaltyTime,
      300,
      "repeating a hint must not charge a second penalty",
    );
    assert.deepEqual(
      [...(afterSecond?.hintUsedLevels ?? [])],
      [1],
      "the level must not be recorded twice",
    );
  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    if (mongo) {
      await mongo.stop();
    }
  }
};

if (require.main === module) {
  runStandalone("hint.behaviour.test", run);
}
