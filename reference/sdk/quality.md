> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Quality and testing

> Run adversarial tests, manage northstar criteria, custom evals, issues, and audit remarks

Test agent behavior with adversarial suites, define quality criteria with northstars, and track issues across conversations.

## Adversarial suites

Group multiple adversarial tests and auto-generate them from a prompt. Use suites to organize related tests and run them together against a specific workflow version.

| Method                         | HTTP                                            | Description                                          |
| ------------------------------ | ----------------------------------------------- | ---------------------------------------------------- |
| `get(suiteId)`                 | `GET /adversarial-suites/:id`                   | Get suite with optional mermaid graph                |
| `update(suiteId, body)`        | `PATCH /adversarial-suites/:id`                 | Update name, model, timeout, generation settings     |
| `delete(suiteId)`              | `DELETE /adversarial-suites/:id`                | Delete a suite                                       |
| `generate(suiteId, body?)`     | `POST /adversarial-suites/:id/generate`         | AI-generate tests from the suite's generation prompt |
| `generateGraph(suiteId, body)` | `POST /adversarial-suites/:id/generate-graph`   | Generate a mermaid workflow visualization            |
| `run(suiteId, body)`           | `POST /adversarial-suites/:id/run`              | Execute all tests, returns `suite_run_id`            |
| `listRuns(suiteId, query?)`    | `GET /adversarial-suites/:id/runs`              | List suite runs                                      |
| `getRun(suiteRunId)`           | `GET /adversarial-suites/runs/:runId`           | Get a suite run with aggregate pass/fail counts      |
| `getRunTestRuns(suiteRunId)`   | `GET /adversarial-suites/runs/:runId/test-runs` | List individual test results within a suite run      |

```ts theme={null}
const { suite } = await client.adversarialSuites.get("suite-id");
await client.adversarialSuites.update("suite-id", {
  name: "New Name",
  generation_count: 10,
});

// Generate tests from the suite's generation_prompt using AI
await client.adversarialSuites.generate("suite-id", { version_id: "v-id" });

// Run all tests in the suite
const { suite_run_id } = await client.adversarialSuites.run("suite-id", {
  version_id: "v-id",
});

// Poll results
const { runs } = await client.adversarialSuites.listRuns("suite-id");
const { run } = await client.adversarialSuites.getRun("suite-run-id");
const { test_runs } = await client.adversarialSuites.getRunTestRuns("suite-run-id");
```

***

## Adversarial tests

Individual adversarial tests that simulate a user trying to break the agent's behavior. Use these to define specific attack scenarios and track their pass/fail history.

| Method                     | HTTP                                          | Description                               |
| -------------------------- | --------------------------------------------- | ----------------------------------------- |
| `get(testId)`              | `GET /adversarial-tests/:id`                  | Get test details                          |
| `update(testId, body)`     | `PATCH /adversarial-tests/:id`                | Update prompt, model, variables, timeout  |
| `delete(testId)`           | `DELETE /adversarial-tests/:id`               | Delete a test                             |
| `run(testId, body)`        | `POST /adversarial-tests/:id/run`             | Execute a test, returns `test_run_id`     |
| `listRuns(testId, query?)` | `GET /adversarial-tests/:id/runs`             | List test runs with audit remarks         |
| `getRun(runId)`            | `GET /adversarial-tests/runs/:runId`          | Get a single run with full audit remarks  |
| `getRunMessages(runId)`    | `GET /adversarial-tests/runs/:runId/messages` | Get the full conversation from a test run |

```ts theme={null}
const { test } = await client.adversarialTests.get("test-id");
await client.adversarialTests.update("test-id", {
  adversarial_prompt: "Try to get PII",
  timeout_seconds: 120,
});

// Run a single test
const { test_run_id } = await client.adversarialTests.run("test-id", {
  version_id: "v-id",
});

// Poll results
const { runs } = await client.adversarialTests.listRuns("test-id");
const { run } = await client.adversarialTests.getRun("run-id");
const { messages } = await client.adversarialTests.getRunMessages("run-id");
```

***

## Northstars

Quality criteria that define how the agent should behave, used to automatically grade conversations. Use these to set expectations for agent behavior and provide feedback to improve grading accuracy.

| Method                              | HTTP                              | Description                                                              |
| ----------------------------------- | --------------------------------- | ------------------------------------------------------------------------ |
| `get(northstarId)`                  | `GET /northstars/:id`             | Get a northstar                                                          |
| `update(northstarId, body)`         | `PATCH /northstars/:id`           | Update name, description, examples, category, priority, or enabled state |
| `delete(northstarId)`               | `DELETE /northstars/:id`          | Delete a northstar                                                       |
| `getHistory(northstarId)`           | `GET /northstars/:id/history`     | Get the full regeneration chain, oldest first                            |
| `submitFeedback(northstarId, body)` | `POST /northstars/:id/feedback`   | Rate correctness (-2 to +2), optionally trigger regeneration             |
| `deleteFeedback(northstarId)`       | `DELETE /northstars/:id/feedback` | Remove your feedback on a northstar                                      |

```ts theme={null}
const { northstar } = await client.northstars.get("northstar-id");
await client.northstars.update("northstar-id", {
  enabled: true,
  priority: "high",
});

const { history } = await client.northstars.getHistory("northstar-id");

// Rate a northstar (-2 = strongly wrong, +2 = strongly correct)
await client.northstars.submitFeedback("northstar-id", {
  correctness: 2,
  feedback: "This criterion is perfect.",
  trigger_regeneration: false,
});

await client.northstars.deleteFeedback("northstar-id");
```

***

## Custom evals

Test a specific prompt node against expected outputs or northstar criteria. Use these to define repeatable test cases for individual nodes and track their pass/fail history over time.

| Method                     | HTTP                         | Description                                                    |
| -------------------------- | ---------------------------- | -------------------------------------------------------------- |
| `get(evalId)`              | `GET /custom-evals/:id`      | Get a custom eval                                              |
| `update(evalId, body)`     | `PATCH /custom-evals/:id`    | Update messages, expected outputs, variables, or northstar IDs |
| `delete(evalId)`           | `DELETE /custom-evals/:id`   | Delete a custom eval                                           |
| `run(evalId, body)`        | `POST /custom-evals/:id/run` | Execute the eval, returns `run_id`                             |
| `listRuns(evalId, query?)` | `GET /custom-evals/:id/runs` | List runs with pass/fail and judge reasoning                   |

```ts theme={null}
const { test } = await client.customEvals.get("eval-id");
await client.customEvals.update("eval-id", {
  name: "Greeting check",
  expected_response: "Hello, how can I help you?",
});

const { run_id } = await client.customEvals.run("eval-id", {
  version_id: "v-id",
});

const { runs } = await client.customEvals.listRuns("eval-id");
```

***

## Issues

Quality issues (flags) raised when a conversation fails a northstar or quality check. Use this to triage and resolve flagged conversations.

| Method                  | HTTP                | Description                                                       |
| ----------------------- | ------------------- | ----------------------------------------------------------------- |
| `update(issueId, body)` | `PATCH /issues/:id` | Update issue status (`open` / `approved` / `rejected` / `closed`) |

```ts theme={null}
await client.issues.update("issue-id", { status: "approved" });
```

***

## Audit remarks

Individual northstar grades attached to a conversation. Feedback on audit remarks improves future grading accuracy by providing signal on whether the automated grade was correct.

| Method                                | HTTP                                 | Description                                                             |
| ------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------- |
| `getFeedback(auditRemarkId)`          | `GET /audit-remarks/:id/feedback`    | Get your feedback for this remark, or `null`                            |
| `submitFeedback(auditRemarkId, body)` | `POST /audit-remarks/:id/feedback`   | Submit thumbs up/down; thumbs-up adds the remark as a northstar example |
| `deleteFeedback(auditRemarkId)`       | `DELETE /audit-remarks/:id/feedback` | Delete your feedback                                                    |

```ts theme={null}
const feedback = await client.auditRemarks.getFeedback("audit-remark-id");

// Thumbs up
await client.auditRemarks.submitFeedback("audit-remark-id", {
  polarity: true,
});

// Thumbs down with attribution
await client.auditRemarks.submitFeedback("audit-remark-id", {
  polarity: false,
  issue_attribution: "northstar",
  comment: "The northstar criteria was wrong here.",
});

await client.auditRemarks.deleteFeedback("audit-remark-id");
```