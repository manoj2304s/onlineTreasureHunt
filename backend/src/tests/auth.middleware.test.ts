import assert from "node:assert/strict";
import { runStandalone } from "./harness";

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

export const run = async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  process.env.PORT = process.env.PORT || "5000";
  const { protect } = await import("../middlewares/auth.middleware");

  await protect(req, res, next);

  assert.equal(statusCode, 401);
  assert.equal(body.message, "Not authorized, no token");
  assert.equal(nextCalled, false);

};

if (require.main === module) {
  runStandalone("auth.middleware.test", run);
}
