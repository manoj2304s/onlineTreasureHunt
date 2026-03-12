import assert from "node:assert/strict";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

const run = async () => {
  if (process.env.RUN_INTEGRATION_TESTS !== "true") {
    console.log("integration.api.test: SKIPPED (set RUN_INTEGRATION_TESTS=true)");
    return;
  }

  let mongo: MongoMemoryServer | null = null;
  let dbUrl = process.env.TEST_DB_URL;

  if (!dbUrl) {
    try {
      mongo = await MongoMemoryServer.create();
      dbUrl = mongo.getUri();
    } catch (error: any) {
      if (error?.code === "EPERM") {
        console.log("integration.api.test: SKIPPED (mongodb spawn blocked in environment)");
        return;
      }
      throw error;
    }
  }

  process.env.DB_URL = dbUrl;
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
  process.env.PORT = process.env.PORT || "5000";

  await mongoose.connect(process.env.DB_URL);

  const appModule = await import("../app");
  const userModule = await import("../models/user.model");
  const app = appModule.default;
  const User = userModule.default;

  const unique = Date.now();
  const playerPayload = {
    username: `player_${unique}`,
    email: `player_${unique}@mail.com`,
    password: "secret123",
  };

  const registerPlayerRes = await request(app)
    .post("/auth/register")
    .send(playerPayload);
  assert.equal(registerPlayerRes.status, 201);

  const loginPlayerRes = await request(app).post("/auth/login").send({
    email: playerPayload.email,
    password: playerPayload.password,
  });
  assert.equal(loginPlayerRes.status, 200);
  const playerToken = loginPlayerRes.body.token as string;
  assert.ok(playerToken);

  const meUnauthorized = await request(app).get("/auth/me");
  assert.equal(meUnauthorized.status, 401);

  const meAuthorized = await request(app)
    .get("/auth/me")
    .set("Authorization", `Bearer ${playerToken}`);
  assert.equal(meAuthorized.status, 200);
  assert.equal(meAuthorized.body.email, playerPayload.email);

  const invalidAnswerPayload = await request(app)
    .post("/gameplay/submit-answer")
    .set("Authorization", `Bearer ${playerToken}`)
    .send({ answer: "" });
  assert.equal(invalidAnswerPayload.status, 400);

  const adminPayload = {
    username: `admin_${unique}`,
    email: `admin_${unique}@mail.com`,
    password: "secret123",
  };

  const registerAdminRes = await request(app)
    .post("/auth/register")
    .send(adminPayload);
  assert.equal(registerAdminRes.status, 201);

  await User.updateOne({ email: adminPayload.email }, { $set: { role: "admin" } });

  const loginAdminRes = await request(app).post("/auth/login").send({
    email: adminPayload.email,
    password: adminPayload.password,
  });
  assert.equal(loginAdminRes.status, 200);
  const adminToken = loginAdminRes.body.token as string;
  assert.ok(adminToken);

  const nonAdminCreateLevel = await request(app)
    .post("/admin/levels")
    .set("Authorization", `Bearer ${playerToken}`)
    .send({});
  assert.equal(nonAdminCreateLevel.status, 403);

  const invalidAdminPayload = await request(app)
    .post("/admin/levels")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({});
  assert.equal(invalidAdminPayload.status, 400);

  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }

  console.log("integration.api.test: PASS");
};

run().catch(async (error) => {
  console.error("integration.api.test: FAIL", error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors during cleanup
  }
  process.exit(1);
});
