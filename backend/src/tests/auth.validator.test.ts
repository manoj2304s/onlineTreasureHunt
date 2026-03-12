import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../validators/auth.validator";

const validRegister = registerSchema.safeParse({
  username: "tester",
  email: "tester@example.com",
  password: "secret123",
});
assert.equal(validRegister.success, true);

const invalidRegister = registerSchema.safeParse({
  username: "te",
  email: "bad-email",
  password: "123",
});
assert.equal(invalidRegister.success, false);

const validLogin = loginSchema.safeParse({
  email: "tester@example.com",
  password: "secret123",
});
assert.equal(validLogin.success, true);

const invalidLogin = loginSchema.safeParse({
  email: "not-an-email",
  password: "123",
});
assert.equal(invalidLogin.success, false);

console.log("auth.validator.test: PASS");
