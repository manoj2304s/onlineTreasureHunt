import "./harness";
import { SkippedError } from "./harness";

import { run as healthController } from "./health.controller.test";
import { run as authValidator } from "./auth.validator.test";
import { run as authMiddleware } from "./auth.middleware.test";
import { run as serviceLogic } from "./service.logic.test";
import { run as integrationApi } from "./integration.api.test";
import { run as hintBehaviour } from "./hint.behaviour.test";

type Suite = { name: string; run: () => Promise<void> };

/**
 * Suites run sequentially, not concurrently: several of them mutate
 * `process.env` and monkey-patch shared Mongoose models, so overlapping runs
 * would interfere with each other.
 */
const suites: Suite[] = [
  { name: "health.controller.test", run: healthController },
  { name: "auth.validator.test", run: authValidator },
  { name: "auth.middleware.test", run: authMiddleware },
  { name: "service.logic.test", run: serviceLogic },
  { name: "hint.behaviour.test", run: hintBehaviour },
  { name: "integration.api.test", run: integrationApi },
];

const main = async () => {
  let passed = 0;
  let failed = 0;
  const skipped: string[] = [];

  for (const suite of suites) {
    try {
      await suite.run();
      passed += 1;
      console.log(`PASS     ${suite.name}`);
    } catch (error) {
      if (error instanceof SkippedError) {
        skipped.push(suite.name);
        console.log(`SKIPPED  ${suite.name} — ${error.message}`);
        continue;
      }
      failed += 1;
      console.error(`FAIL     ${suite.name}`);
      console.error(error);
    }
  }

  const total = suites.length;
  console.log("");
  console.log("─".repeat(60));
  console.log(
    `Suites: ${passed} passed, ${failed} failed, ${skipped.length} skipped, ${total} total`,
  );
  if (skipped.length > 0) {
    console.log(`Skipped: ${skipped.join(", ")}`);
    console.log("These suites did NOT run — their coverage is not represented above.");
  }
  console.log("─".repeat(60));

  process.exit(failed > 0 ? 1 : 0);
};

void main();
