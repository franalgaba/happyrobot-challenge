import { HappyRobotClient } from "@happyrobot-ai/sdk";
import { createVoiceAgent } from "@happyrobot-ai/sdk/helpers";
import { describeSdkError } from "./sdk-errors";
import { buildAgentPrompt, INITIAL_MESSAGE, WORKFLOW_NAME, workflowVariables } from "./workflow-spec";

const DEFAULT_DRY_RUN_WORKFLOW_ID = "dry-run-workflow-id";
const DEFAULT_HAPPYROBOT_ENVIRONMENT = "production";
const MCP_SERVER_NAME = "Carrier Sales Hono MCP";
const WORKFLOW_DESCRIPTION = "Inbound carrier load sales POC backed by Hono tools and Postgres.";

type SyncOptions = {
  dryRun: boolean;
  publish: boolean;
};

type WorkflowReference = {
  id: string;
  name: string;
};

type WorkflowVariable = {
  id?: string;
  key?: string;
  name?: string;
};

type WorkflowVariablePayload = {
  key: string;
  value_production: string;
  value_staging: string;
  value_development: string;
};

type McpServer = {
  id?: string;
  mcp_id?: string;
  name?: string;
  url?: string;
  server_name?: string;
  server_url?: string;
};

type McpServerPayload = {
  server_name: string;
  server_url: string;
  auth_type: "none";
};

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function mcpUrl(apiBaseUrl: string, token: string) {
  return `${apiBaseUrl.replace(/\/$/, "")}/mcp/${token}`;
}

function happyRobotCluster() {
  return process.env.HAPPYROBOT_CLUSTER === "eu" ? "eu" : "us";
}

function happyRobotEnvironment() {
  return process.env.HAPPYROBOT_ENVIRONMENT === "development" || process.env.HAPPYROBOT_ENVIRONMENT === "staging"
    ? process.env.HAPPYROBOT_ENVIRONMENT
    : DEFAULT_HAPPYROBOT_ENVIRONMENT;
}

function createClient(apiKey: string) {
  return new HappyRobotClient({
    apiKey,
    cluster: happyRobotCluster(),
    timeout: 30_000,
    maxRetries: 2,
  });
}

function variablePayload(key: string, value: string): WorkflowVariablePayload {
  return {
    key,
    value_production: value,
    value_staging: value,
    value_development: value,
  };
}

function variableMatches(variable: WorkflowVariable, key: string) {
  return variable.key === key || variable.name === key;
}

async function upsertVariable(client: HappyRobotClient, workflowId: string, key: string, value: string, dryRun: boolean) {
  if (dryRun) {
    console.log(`Would upsert variable ${key}=${value}`);
    return;
  }

  const { data } = await client.variables.list(workflowId);
  const existing = (data as WorkflowVariable[]).find((variable) => variableMatches(variable, key));
  const payload = variablePayload(key, value);

  if (existing?.id) {
    await client.variables.update(workflowId, existing.id, payload);
  } else {
    await client.variables.create(workflowId, payload);
  }
}

async function findWorkflowByName(client: HappyRobotClient, name: string) {
  for await (const workflow of client.workflows.listAll()) {
    if (workflow.name === name) {
      return workflow;
    }
  }
  return null;
}

async function inspectEditableNodes(client: HappyRobotClient, workflowId: string) {
  const versions = await client.workflows.listVersions(workflowId);
  const latestVersion = versions.data[0];
  if (!latestVersion?.id) {
    return { latestVersion: null, nodes: [] as unknown[] };
  }

  const nodes = await client.nodes.list(latestVersion.id);
  return { latestVersion, nodes: Array.isArray(nodes) ? nodes : (nodes as { data?: unknown[] }).data ?? [] };
}

function mcpPayload(url: string): McpServerPayload {
  return {
    server_name: MCP_SERVER_NAME,
    server_url: url,
    auth_type: "none",
  };
}

function mcpServerId(server: McpServer) {
  return server.id ?? server.mcp_id;
}

function mcpServerUrl(server: McpServer) {
  return server.server_url ?? server.url;
}

function mcpServerMatchesUrl(server: McpServer, url: string) {
  return mcpServerUrl(server) === url;
}

async function registerMcp(client: HappyRobotClient, url: string, dryRun: boolean) {
  if (dryRun) {
    console.log(`Would register MCP server "${MCP_SERVER_NAME}" at ${url}`);
    return null;
  }

  const { data } = await client.mcp.list();
  const existing = (data as McpServer[]).find((server) => mcpServerMatchesUrl(server, url));
  const server = existing ?? (await client.mcp.create(mcpPayload(url)));
  const id = mcpServerId(server as McpServer);

  if (id) {
    await client.mcp.refresh(id);
  }

  return server;
}

async function authenticateClient(client: HappyRobotClient) {
  const keyInfo = await client.apiKey.describe();
  console.log(`Authenticated HappyRobot API key: ${(keyInfo as { name?: string }).name ?? "unnamed key"}`);
}

async function createWorkflow(client: HappyRobotClient, prompt: string): Promise<WorkflowReference> {
  const created = await createVoiceAgent(client, {
    name: WORKFLOW_NAME,
    template: "inbound-voice-agent",
    prompt,
    initialMessage: INITIAL_MESSAGE,
    publish: false,
    environment: happyRobotEnvironment(),
  });
  console.log(`Created workflow ${created.workflow.id}`);
  return created.workflow;
}

async function updateWorkflow(client: HappyRobotClient, workflow: WorkflowReference) {
  console.log(`Using existing workflow ${workflow.id}`);
  await client.workflows.update(workflow.id, {
    name: WORKFLOW_NAME,
    description: WORKFLOW_DESCRIPTION,
  });
}

async function resolveWorkflow(client: HappyRobotClient, prompt: string): Promise<WorkflowReference> {
  const workflowId = process.env.HAPPYROBOT_WORKFLOW_ID;
  const existing = workflowId ? await client.workflows.get(workflowId) : await findWorkflowByName(client, WORKFLOW_NAME);

  if (!existing) {
    return createWorkflow(client, prompt);
  }

  const workflow = existing as WorkflowReference;
  await updateWorkflow(client, workflow);
  return workflow;
}

function dryRunWorkflow(): WorkflowReference {
  console.log(`Would create or update inbound voice workflow "${WORKFLOW_NAME}" from template.`);
  return { id: process.env.HAPPYROBOT_WORKFLOW_ID ?? DEFAULT_DRY_RUN_WORKFLOW_ID, name: WORKFLOW_NAME };
}

function printManualFallback(input: {
  workflowId: string;
  workflowName: string;
  mcpUrl: string;
  apiBaseUrl: string;
  nodes: unknown[];
}) {
  console.log("\nManual Builder fallback");
  console.log("-----------------------");
  console.log(`Workflow: ${input.workflowName} (${input.workflowId})`);
  console.log(`MCP URL: ${input.mcpUrl}`);
  console.log(`API base URL: ${input.apiBaseUrl}`);
  console.log("1. Open the workflow in HappyRobot Builder.");
  console.log("2. Confirm it has a Web Call trigger node and the inbound carrier sales prompt.");
  console.log("3. Attach the registered MCP server named \"Carrier Sales Hono MCP\".");
  console.log("4. Enable tools: verify_carrier, search_loads, negotiate_offer, finalize_call.");
  console.log("5. Publish the workflow after a test call succeeds.");
  console.log("6. Store the published workflow ID in HAPPYROBOT_WORKFLOW_ID.");
  console.log(`Discovered node count: ${input.nodes.length}`);
}

async function main(options: SyncOptions) {
  const apiKey = requiredEnv("HAPPYROBOT_API_KEY");
  const apiBaseUrl = requiredEnv("PUBLIC_API_BASE_URL");
  const token = requiredEnv("MCP_PATH_TOKEN");
  const url = mcpUrl(apiBaseUrl, token);
  const prompt = buildAgentPrompt(apiBaseUrl, url);

  const client = createClient(apiKey);

  if (options.dryRun) {
    console.log("Dry run enabled; no HappyRobot resources will be changed.");
  } else {
    await authenticateClient(client);
  }

  const workflow = options.dryRun ? dryRunWorkflow() : await resolveWorkflow(client, prompt);

  for (const [name, value] of Object.entries(workflowVariables(apiBaseUrl, url))) {
    await upsertVariable(client, workflow.id, name, value, options.dryRun);
  }

  await registerMcp(client, url, options.dryRun);

  let nodes: unknown[] = [];
  if (!options.dryRun) {
    try {
      const inspection = await inspectEditableNodes(client, workflow.id);
      nodes = inspection.nodes;
      if (inspection.latestVersion?.id) {
        console.log(`Latest version: ${inspection.latestVersion.id}`);
        console.log(`Inspected ${nodes.length} workflow nodes for manual verification.`);
      }
    } catch (error) {
      console.log(`Node inspection skipped: ${describeSdkError(error)}`);
    }
  }

  if (options.publish && !options.dryRun) {
    await client.workflows.publish(workflow.id);
    console.log(`Published workflow ${workflow.id}`);
  }

  printManualFallback({
    workflowId: workflow.id,
    workflowName: WORKFLOW_NAME,
    mcpUrl: url,
    apiBaseUrl,
    nodes,
  });
}

main({ dryRun: hasFlag("--dry-run"), publish: hasFlag("--publish") }).catch((error) => {
  console.error(describeSdkError(error));
  process.exit(1);
});
