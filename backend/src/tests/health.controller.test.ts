import assert from "node:assert/strict";
import { healthCheck } from "../controllers/health.controller";
import { runStandalone } from "./harness";

export const run = async () => {
  let statusCode = 0;
  let body: any = null;

  const req = {} as any;
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

  healthCheck(req, res);

  assert.equal(statusCode, 200);
  assert.equal(body.status, "OK");
  assert.equal(body.message, "Server is healthy");
  assert.ok(typeof body.timeStamp === "string" && body.timeStamp.length > 0);
};

if (require.main === module) {
  runStandalone("health.controller.test", run);
}
