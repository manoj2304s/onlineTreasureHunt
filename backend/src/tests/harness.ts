/**
 * Shared test harness.
 *
 * Importing this module applies safe defaults for every environment variable
 * the app validates at import time. Without it, suites only pass on a machine
 * that happens to have a populated `.env`, and fail on a fresh clone or in CI.
 */

const setDefault = (key: string, value: string) => {
  if (!process.env[key]) {
    process.env[key] = value;
  }
};

setDefault("DB_URL", "mongodb://localhost:27017/test");
setDefault("JWT_SECRET", "test-secret");
setDefault("CORS_ORIGINS", "http://localhost:3000");
setDefault("PORT", "5000");
setDefault("ADMIN_CODE", "000000");

/** Thrown by a suite that cannot run in the current environment. */
export class SkippedError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "SkippedError";
  }
}

export const skip = (reason: string): never => {
  throw new SkippedError(reason);
};

/**
 * Runs a suite directly when its file is executed on its own
 * (e.g. `node dist/tests/integration.api.test.js`).
 */
export const runStandalone = (name: string, run: () => Promise<void>) => {
  run().catch((error) => {
    if (error instanceof SkippedError) {
      console.log(`${name}: SKIPPED — ${error.message}`);
      return;
    }
    console.error(`${name}: FAIL`, error);
    process.exit(1);
  });
};
