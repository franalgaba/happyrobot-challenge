> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Workflows

> Manage workflows, versions, nodes, runs, and folders with the TypeScript SDK

Build and manage workflows programmatically, including version control, node configuration, run execution, and folder organization.

## Workflows

Workflow CRUD, publishing, runs, and templates. Use this to create, configure, and trigger workflows, as well as browse available templates.

| Method                             | HTTP                              | Description                    |
| ---------------------------------- | --------------------------------- | ------------------------------ |
| `list(query?)`                     | `GET /workflows`                  | List workflows (paginated)     |
| `listAll(query?)`                  | `GET /workflows`                  | Async generator over all pages |
| `create(body)`                     | `POST /workflows`                 | Create a new workflow          |
| `get(workflowId)`                  | `GET /workflows/:id`              | Get workflow by ID or slug     |
| `update(workflowId, body)`         | `PATCH /workflows/:id`            | Update name, description, etc. |
| `delete(workflowId)`               | `DELETE /workflows/:id`           | Delete a workflow              |
| `duplicate(workflowId, body?)`     | `POST /workflows/:id/duplicate`   | Duplicate a workflow           |
| `publish(workflowId, body?)`       | `POST /workflows/:id/publish`     | Publish the latest version     |
| `unpublish(workflowId)`            | `POST /workflows/:id/unpublish`   | Unpublish a workflow           |
| `cancelRuns(workflowId)`           | `POST /workflows/:id/cancel-runs` | Cancel all active runs         |
| `listTemplates(query?)`            | `GET /workflows/templates`        | List workflow templates        |
| `listVersions(workflowId, query?)` | `GET /workflows/:id/versions`     | List versions for a workflow   |
| `listRuns(workflowId, query?)`     | `GET /workflows/:id/runs`         | List runs for a workflow       |
| `triggerRun(workflowId, body?)`    | `POST /workflows/:id/runs`        | Trigger a new run              |

```ts theme={null}
// List workflows (paginated)
const { data, pagination } = await client.workflows.list({ page: 1, limit: 20 });

// Iterate all workflows across pages
for await (const wf of client.workflows.listAll()) {
  console.log(wf.name);
}

// Create a workflow
const wf = await client.workflows.create({ name: "My Workflow" });

// Get by ID or slug
const wf = await client.workflows.get("my-workflow");

// Update
await client.workflows.update("my-workflow", { name: "New Name" });

// Delete
await client.workflows.delete("my-workflow");

// Duplicate
await client.workflows.duplicate("my-workflow", { name: "Copy" });

// Publish / unpublish
await client.workflows.publish("my-workflow");
await client.workflows.unpublish("my-workflow");

// Cancel all active runs
await client.workflows.cancelRuns("my-workflow");

// List templates
const { data } = await client.workflows.listTemplates();

// List versions
const { data } = await client.workflows.listVersions("my-workflow");

// List runs
const { data } = await client.workflows.listRuns("my-workflow");

// Trigger a run
const { run_id } = await client.workflows.triggerRun("my-workflow", {
  payload: { phone: "+1..." },
});
```

***

## Versions

Version management — fork, publish, lock, and test. Use this to manage workflow versions, run test suites against them, and control which version is live.

| Method                       | HTTP                              | Description                                    |
| ---------------------------- | --------------------------------- | ---------------------------------------------- |
| `get(versionId)`             | `GET /versions/:id`               | Get version with node summary and changelog    |
| `update(versionId, body)`    | `PATCH /versions/:id`             | Update name or description                     |
| `fork(versionId)`            | `POST /versions/:id/fork`         | Clone a version                                |
| `publish(versionId, body?)`  | `POST /versions/:id/publish`      | Publish a version                              |
| `unpublish(versionId)`       | `POST /versions/:id/unpublish`    | Unpublish a version                            |
| `lock(versionId)`            | `POST /versions/:id/lock`         | Lock a version (prevent edits)                 |
| `unlock(versionId)`          | `POST /versions/:id/unlock`       | Unlock a version                               |
| `testAll(versionId)`         | `POST /versions/:id/test-all`     | Run test-all validation                        |
| `getPromptIssues(versionId)` | `GET /versions/:id/prompt-issues` | Get prompt quality issues for all prompt nodes |

```ts theme={null}
const version = await client.versions.get("version-id");
await client.versions.update("version-id", { name: "v2" });
await client.versions.fork("version-id");
await client.versions.publish("version-id");
await client.versions.unpublish("version-id");
await client.versions.lock("version-id");
await client.versions.unlock("version-id");
await client.versions.testAll("version-id");
const issues = await client.versions.getPromptIssues("version-id");
```

***

## Nodes

Node CRUD, config schema, and available variables. Nodes are always scoped to a version and represent individual steps in a workflow.

| Method                                | HTTP                                           | Description                                        |
| ------------------------------------- | ---------------------------------------------- | -------------------------------------------------- |
| `list(versionId)`                     | `GET /versions/:vId/nodes`                     | List all nodes in a version                        |
| `addBatch(versionId, body)`           | `POST /versions/:vId/nodes`                    | Add nodes in batch (1-50)                          |
| `get(versionId, nodeId)`              | `GET /versions/:vId/nodes/:nId`                | Get a single node                                  |
| `update(versionId, nodeId, body)`     | `PUT /versions/:vId/nodes/:nId`                | Update a node                                      |
| `delete(versionId, nodeId)`           | `DELETE /versions/:vId/nodes/:nId`             | Delete a node                                      |
| `getConfigSchema(versionId, nodeId)`  | `GET /versions/:vId/nodes/:nId/config-schema`  | Get field types and requirements                   |
| `getAvailableVars(versionId, nodeId)` | `GET /versions/:vId/nodes/:nId/available-vars` | Get upstream variables available to this node      |
| `test(versionId, nodeId, body?)`      | `POST /versions/:vId/nodes/:nId/test`          | Test a single node (version must not be published) |

```ts theme={null}
const nodes = await client.nodes.list("version-id");
await client.nodes.addBatch("version-id", { nodes: [...] });
const node = await client.nodes.get("version-id", "node-id");
await client.nodes.update("version-id", "node-id", { config: { ... } });
await client.nodes.delete("version-id", "node-id");
const schema = await client.nodes.getConfigSchema("version-id", "node-id");
const vars = await client.nodes.getAvailableVars("version-id", "node-id");
const result = await client.nodes.test("version-id", "node-id");
```

***

## Runs

Run details, cancellation, and annotations. Use this to inspect run results, fetch associated sessions and recordings, and annotate runs for quality tracking.

| Method                       | HTTP                              | Description                                     |
| ---------------------------- | --------------------------------- | ----------------------------------------------- |
| `get(runId)`                 | `GET /runs/:id`                   | Get run details                                 |
| `listNodes(runId, query?)`   | `GET /runs/:id/nodes`             | List node executions for a run                  |
| `getOutput(runId, outputId)` | `GET /runs/:id/outputs/:outputId` | Get full output payload for a node execution    |
| `getSessions(runId, query?)` | `GET /runs/:id/sessions`          | Get sessions for a run                          |
| `getRecordings(runId)`       | `GET /runs/:id/recordings`        | Get recordings for a run                        |
| `getFlags(runId, query?)`    | `GET /runs/:id/flags`             | Get quality flags for a run                     |
| `cancel(runId)`              | `POST /runs/:id/cancel`           | Cancel a run                                    |
| `mark(runId, body)`          | `POST /runs/:id/mark`             | Annotate a run (correct / incorrect / critical) |

```ts theme={null}
const run = await client.runs.get("run-id");

// List node executions (optionally filter by node_persistent_id)
const nodes = await client.runs.listNodes("run-id", { node_persistent_id: "node-abc" });

// Fetch the full output payload for a specific node execution
const output = await client.runs.getOutput("run-id", nodes.data[0].output_id);

const sessions = await client.runs.getSessions("run-id");
const recordings = await client.runs.getRecordings("run-id");
const flags = await client.runs.getFlags("run-id");
await client.runs.cancel("run-id");
await client.runs.mark("run-id", { annotation: "correct" });
```

***

## Workflow folders

Organize workflows into folders. Use this to group related workflows for easier navigation and management.

| Method                   | HTTP                           | Description              |
| ------------------------ | ------------------------------ | ------------------------ |
| `list(query?)`           | `GET /workflow-folders`        | List folders (paginated) |
| `create(body)`           | `POST /workflow-folders`       | Create a folder          |
| `get(folderId)`          | `GET /workflow-folders/:id`    | Get a folder             |
| `update(folderId, body)` | `PUT /workflow-folders/:id`    | Update a folder          |
| `delete(folderId)`       | `DELETE /workflow-folders/:id` | Delete a folder          |

```ts theme={null}
const { data } = await client.workflowFolders.list();
await client.workflowFolders.create({ name: "Production" });
const folder = await client.workflowFolders.get("folder-id");
await client.workflowFolders.update("folder-id", { name: "Updated" });
await client.workflowFolders.delete("folder-id");
```