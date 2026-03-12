import assert from "node:assert/strict";

const req = { headers: {} } as any;
let statusCode = 0;
let body: any = null;

const res = {
  status(code: number) {
    statusCode = code;
    return this;
  },
  json(payload: any) {
    body = payload;
    return this;
  },
} as any;

let nextCalled = false;
const next = () => {
  nextCalled = true;
};

const run = async () => {
  process.env.DB_URL = process.env.DB_URL || "mongodb://localhost:27017/test";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
  process.env.PORT = process.env.PORT || "5000";
  const { protect } = await import("../middlewares/auth.middleware");

  await protect(req, res, next);

  assert.equal(statusCode, 401);
  assert.equal(body.message, "Not authorized, no token");
  assert.equal(nextCalled, false);

  console.log("auth.middleware.test: PASS");
};

run().catch((error) => {
  console.error("auth.middleware.test: FAIL", error);
  process.exit(1);
});
