import { HappyRobotClient } from "@happyrobot-ai/sdk";
import { createVoiceAgent } from "@happyrobot-ai/sdk/helpers";
import { describeSdkError } from "./sdk-errors";
import { buildAgentPrompt, INITIAL_MESSAGE, WORKFLOW_NAME, workflowVariables } from "./workflow-spec";

const DEFAULT_DRY_RUN_WORKFLOW_ID = "dry-run-workflow-id";
const DEFAULT_HAPPYROBOT_ENVIRONMENT = "production";
const MCP_SERVER_NAME = "Carrier Sales Hono MCP";
const WORKFLOW_DESCRIPTION = "Inbound carrier load sales POC backed by Hono tools and Postgres.";
const DEFAULT_MODEL = { type: "static", static: { id: "turbo-one", name: "gpt-4.1" } } as const;
const DEFAULT_VOICE = { type: "static", static: { id: "m357hexpjk2s", name: "Paul" } } as const;
const DEFAULT_LANGUAGE = { type: "static", static: { id: "en", name: "English" } } as const;
const DEFAULT_LANGUAGE_ACCENT = { type: "static", static: { id: "en-us", name: "English (US)" } } as const;
const MCP_INTEGRATION_ID = "019d4a7a-f3e9-7470-a7cc-dd4c7ad6376e";
const MCP_CALL_EVENT_ID = "019d4a7a-f3e9-7748-b002-efb988800cd3";
const TOOL_DEFINITIONS = [
  {
    name: "verify_carrier",
    description: "Use this tool after the caller gives an MC number and before discussing load details. It verifies carrier eligibility.",
    parameters: [
      {
        name: "mcNumber",
        type: "string",
        required: true,
        example: "123456",
        description: "Carrier MC number from the caller, with or without an MC prefix.",
      },
    ],
  },
  {
    name: "search_loads",
    description: "Use this tool after the carrier describes lane, equipment, or pickup preferences. It finds matching active loads.",
    parameters: [
      {
        name: "origin",
        type: "string",
        required: false,
        example: "Atlanta, GA",
        description: "Pickup origin city and state requested by the carrier.",
      },
      {
        name: "destination",
        type: "string",
        required: false,
        example: "Dallas, TX",
        description: "Delivery destination city and state requested by the carrier.",
      },
      {
        name: "equipmentType",
        type: "string",
        required: false,
        example: "Dry Van",
        description: "Equipment type requested by the carrier.",
      },
      {
        name: "pickupDate",
        type: "string",
        required: false,
        example: "2026-06-05",
        description: "Preferred pickup date in ISO date format when the caller gives one.",
      },
      {
        name: "limit",
        type: "number",
        required: false,
        example: "3",
        description: "Maximum number of loads to return. Use 3 for normal calls.",
      },
    ],
  },
  {
    name: "negotiate_offer",
    description: "Use this tool whenever the carrier makes a rate offer or counteroffer. It decides whether to accept, counter, or reject.",
    parameters: [
      {
        name: "sessionId",
        type: "string",
        required: true,
        example: "call-session-123",
        description: "Stable call-specific HappyRobot session, run, or room identifier.",
      },
      {
        name: "negotiationId",
        type: "string",
        required: false,
        example: "uuid-from-previous-response",
        description: "Existing negotiation ID returned by the previous negotiation response for the same load.",
      },
      {
        name: "loadId",
        type: "string",
        required: true,
        example: "HR-ATL-DAL-001",
        description: "Load ID the carrier is negotiating for.",
      },
      {
        name: "mcNumber",
        type: "string",
        required: true,
        example: "123456",
        description: "Verified carrier MC number.",
      },
      {
        name: "carrierOfferRate",
        type: "number",
        required: true,
        example: "2600",
        description: "Carrier's current offer rate as a numeric dollar amount.",
      },
    ],
  },
  {
    name: "finalize_call",
    description: "Use this tool before ending every call to persist the outcome, sentiment, summary, and extracted carrier/load details.",
    parameters: [
      {
        name: "happyrobotRunId",
        type: "string",
        required: false,
        example: "run-123",
        description: "HappyRobot run ID when available.",
      },
      {
        name: "happyrobotSessionId",
        type: "string",
        required: false,
        example: "session-123",
        description: "HappyRobot session or room identifier when available.",
      },
      {
        name: "negotiationId",
        type: "string",
        required: false,
        example: "uuid-from-negotiation",
        description: "Negotiation ID from the negotiation tool when available.",
      },
      {
        name: "loadId",
        type: "string",
        required: false,
        example: "HR-ATL-DAL-001",
        description: "Selected or discussed load ID when available.",
      },
      {
        name: "mcNumber",
        type: "string",
        required: false,
        example: "123456",
        description: "Carrier MC number when collected.",
      },
      {
        name: "outcome",
        type: "string",
        required: true,
        example: "booked",
        description: "Final outcome: booked, rejected, no_match, ineligible, transferred, follow_up, or human_review.",
      },
      {
        name: "sentiment",
        type: "string",
        required: true,
        example: "neutral",
        description: "Caller sentiment: positive, neutral, negative, or mixed.",
      },
      {
        name: "agreedRate",
        type: "number",
        required: false,
        example: "2350",
        description: "Agreed rate as a numeric dollar amount when booked.",
      },
      {
        name: "transferMock",
        type: "boolean",
        required: false,
        example: "true",
        description: "True when the mock transfer completed successfully.",
      },
      {
        name: "summary",
        type: "string",
        required: false,
        example: "Verified carrier booked HR-ATL-DAL-001 at 2350.",
        description: "Brief summary of the call and final disposition.",
      },
      {
        name: "transcript",
        type: "string",
        required: false,
        example: "Caller provided MC 123456...",
        description: "Transcript or compact transcript summary when available.",
      },
      {
        name: "extractedData",
        type: "object",
        required: false,
        example: "{\"carrier\":{\"mcNumber\":\"123456\"}}",
        description: "JSON object with known carrier, requested lane, selected load, negotiation, and demo details.",
      },
    ],
  },
] as const;

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
  created_at?: string;
  updated_at?: string;
  last_connected_at?: string;
};

type McpServerPayload = {
  server_name: string;
  server_url: string;
  auth_type: "none";
};

type WorkflowNode = {
  id?: string;
  name?: string;
  type?: string;
  parent_id?: string | null;
  sort_index?: number;
  event_id?: string;
  integration_id?: string;
  configuration?: Record<string, unknown>;
  function?: unknown;
};

type WorkflowVersion = {
  id?: string;
  is_published?: boolean;
  is_live?: boolean;
  is_locked?: boolean;
  version_number?: number;
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

function redactMcpUrl(url: string) {
  return url.replace(/\/mcp\/[^/?#]+/, "/mcp/<redacted>");
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

async function findWorkflowById(client: HappyRobotClient, workflowId: string) {
  try {
    return await client.workflows.get(workflowId);
  } catch (error) {
    const message = describeSdkError(error);
    if (message.includes("404") || message.toLowerCase().includes("not found")) {
      return null;
    }
    throw error;
  }
}

function versionNeedsFork(version: WorkflowVersion) {
  return Boolean(version.is_live || version.is_published || version.is_locked);
}

function forkedVersionId(forked: unknown) {
  const candidate = forked as { id?: string; data?: { id?: string }; version?: { id?: string } };
  return candidate.id ?? candidate.data?.id ?? candidate.version?.id;
}

async function editableVersion(client: HappyRobotClient, workflowId: string) {
  const versions = await client.workflows.listVersions(workflowId);
  const latestVersion = versions.data[0] as WorkflowVersion | undefined;
  if (!latestVersion?.id) {
    return null;
  }

  if (!versionNeedsFork(latestVersion)) {
    return latestVersion;
  }

  const forked = await client.versions.fork(latestVersion.id);
  const id = forkedVersionId(forked);
  if (!id) {
    throw new Error(`HappyRobot did not return an ID after forking version ${latestVersion.id}.`);
  }
  console.log(`Forked locked/live version ${latestVersion.id} into editable version ${id}`);
  return { ...latestVersion, id, is_published: false, is_live: false, is_locked: false };
}

async function inspectWorkflowNodes(client: HappyRobotClient, versionId: string) {
  const nodes = await client.nodes.list(versionId);
  return (Array.isArray(nodes) ? nodes : (nodes as { data?: WorkflowNode[] }).data ?? []) as WorkflowNode[];
}

async function listVersionNodes(client: HappyRobotClient, versionId: string) {
  return inspectWorkflowNodes(client, versionId);
}

async function inspectEditableNodes(client: HappyRobotClient, workflowId: string) {
  const latestVersion = await editableVersion(client, workflowId);
  if (!latestVersion?.id) {
    return { latestVersion: null, nodes: [] as WorkflowNode[] };
  }

  const nodes = await inspectWorkflowNodes(client, latestVersion.id);
  return { latestVersion, nodes };
}

async function inspectLatestNodes(client: HappyRobotClient, versionId: string) {
  return { latestVersion: { id: versionId }, nodes: await inspectWorkflowNodes(client, versionId) };
}

function paragraph(text: string) {
  return [{ type: "paragraph", children: [{ text }] }];
}

function emptyToolMessage() {
  return {
    type: "none",
    example: "",
    description: [],
  };
}

function toolParameters(tool: (typeof TOOL_DEFINITIONS)[number]) {
  return tool.parameters.map((parameter) => ({
    name: parameter.name,
    type: parameter.type,
    required: parameter.required,
    example: parameter.example,
    description: paragraph(parameter.description),
  }));
}

function templatedParameterValue(toolName: string, parameterName: string) {
  return `{{${toolName}.${parameterName}}}`;
}

function toolArgs(tool: (typeof TOOL_DEFINITIONS)[number]) {
  return tool.parameters.map((parameter) => ({
    key: parameter.name,
    value: templatedParameterValue(tool.name, parameter.name),
  }));
}

function nodeName(node: WorkflowNode) {
  return node.name?.toLowerCase() ?? "";
}

function findRequiredNode(nodes: WorkflowNode[], description: string, predicate: (node: WorkflowNode) => boolean) {
  const node = nodes.find(predicate);
  if (!node?.id) {
    throw new Error(`Could not find ${description} node in the latest workflow version.`);
  }
  return node;
}

async function configurePromptNode(client: HappyRobotClient, versionId: string, node: WorkflowNode, prompt: string) {
  await client.nodes.update(versionId, node.id!, {
    type: "prompt",
    name: node.name ?? "Prompt",
    parent_id: node.parent_id ?? null,
    sort_index: node.sort_index ?? -1,
    prompt_md: prompt,
    initial_message: INITIAL_MESSAGE,
    model: DEFAULT_MODEL,
  });
  console.log(`Configured prompt node ${node.id}`);
}

async function configureVoiceAgentNode(client: HappyRobotClient, versionId: string, node: WorkflowNode, webCallNode: WorkflowNode) {
  await client.nodes.update(versionId, node.id!, {
    type: "action",
    name: node.name ?? "Inbound Voice Agent",
    parent_id: node.parent_id ?? null,
    sort_index: node.sort_index ?? 0,
    event_id: node.event_id,
    integration_id: node.integration_id,
    configuration: {
      ...node.configuration,
      call: {
        type: "static",
        static: {
          id: webCallNode.id,
          name: webCallNode.name ?? "Web Call",
        },
      },
      agent: {
        name: paragraph(WORKFLOW_NAME),
        voices: [DEFAULT_VOICE],
        languages: [DEFAULT_LANGUAGE],
        language_accents: [DEFAULT_LANGUAGE_ACCENT],
      },
      business_hours_setting_name: "default",
    },
  });
  console.log(`Configured inbound voice agent node ${node.id}`);
}

function mcpCallConfiguration(toolName: string, credentialId: string) {
  const tool = TOOL_DEFINITIONS.find((definition) => definition.name === toolName);

  return {
    credentialId,
    credential: {
      type: "static",
      static: {
        id: credentialId,
        name: MCP_SERVER_NAME,
      },
    },
    tool_name: toolName,
    tool_args: tool ? toolArgs(tool) : [],
    dynamic_headers: [],
  };
}

async function upsertToolNode(
  client: HappyRobotClient,
  versionId: string,
  promptNode: WorkflowNode,
  tool: (typeof TOOL_DEFINITIONS)[number],
  sortIndex: number,
) {
  const nodes = await listVersionNodes(client, versionId);
  const existing = nodes.find((node) => node.type === "tool" && node.name === tool.name && node.parent_id === promptNode.id);
  const body = {
    type: "tool",
    name: tool.name,
    parent_id: promptNode.id,
    sort_index: sortIndex,
    function: {
      description: paragraph(tool.description),
      parameters: toolParameters(tool),
      message: emptyToolMessage(),
    },
  };

  if (existing?.id) {
    await client.nodes.update(versionId, existing.id, body);
    console.log(`Configured tool node ${existing.id} (${tool.name})`);
    return { ...existing, ...body };
  }

  const created = await client.nodes.addBatch(versionId, {
    nodes: [
      {
        type: "tool",
        name: tool.name,
        parent_node_id: promptNode.id,
        sort_index: sortIndex,
        configuration: {},
      },
    ],
  });
  const createdNode = (created as { data?: WorkflowNode[] }).data?.[0];
  if (!createdNode?.id) {
    throw new Error(`HappyRobot did not return an ID for created tool node ${tool.name}.`);
  }
  await client.nodes.update(versionId, createdNode.id, body);
  console.log(`Created and configured tool node ${createdNode.id} (${tool.name})`);
  return { ...createdNode, ...body };
}

async function upsertMcpCallNode(
  client: HappyRobotClient,
  versionId: string,
  toolNode: WorkflowNode,
  tool: (typeof TOOL_DEFINITIONS)[number],
  credentialId: string,
) {
  if (!toolNode.id) {
    throw new Error(`Cannot configure MCP Call for ${tool.name} because the tool node has no ID.`);
  }

  const nodes = await listVersionNodes(client, versionId);
  const existing = nodes.find(
    (node) =>
      node.type === "action" &&
      node.parent_id === toolNode.id &&
      (node.event_id === MCP_CALL_EVENT_ID || node.integration_id === MCP_INTEGRATION_ID || nodeName(node) === "mcp call"),
  );
  const body = {
    type: "action",
    name: "MCP Call",
    parent_id: toolNode.id,
    sort_index: 0,
    event_id: MCP_CALL_EVENT_ID,
    integration_id: MCP_INTEGRATION_ID,
    configuration: mcpCallConfiguration(tool.name, credentialId),
  };

  if (existing?.id) {
    await client.nodes.update(versionId, existing.id, body);
    console.log(`Configured MCP Call node ${existing.id} (${tool.name})`);
    return;
  }

  const created = await client.nodes.addBatch(versionId, {
    nodes: [
      {
        type: "action",
        name: "MCP Call",
        parent_node_id: toolNode.id,
        sort_index: 0,
        event_id: MCP_CALL_EVENT_ID,
        integration_id: MCP_INTEGRATION_ID,
        configuration: mcpCallConfiguration(tool.name, credentialId),
      },
    ],
  });
  const createdNode = (created as { data?: WorkflowNode[] }).data?.[0];
  if (!createdNode?.id) {
    throw new Error(`HappyRobot did not return an ID for created MCP Call node ${tool.name}.`);
  }
  await client.nodes.update(versionId, createdNode.id, body);
  console.log(`Created and configured MCP Call node ${createdNode.id} (${tool.name})`);
}

async function configureToolNodes(client: HappyRobotClient, versionId: string, promptNode: WorkflowNode, credentialId: string) {
  for (const [index, tool] of TOOL_DEFINITIONS.entries()) {
    const toolNode = await upsertToolNode(client, versionId, promptNode, tool, index);
    await upsertMcpCallNode(client, versionId, toolNode, tool, credentialId);
  }
}

async function configureWorkflowNodes(client: HappyRobotClient, workflowId: string, prompt: string, mcpCredentialId: string) {
  const inspection = await inspectEditableNodes(client, workflowId);
  if (!inspection.latestVersion?.id) {
    throw new Error(`Workflow ${workflowId} does not have an editable version.`);
  }

  const webCallNode = findRequiredNode(
    inspection.nodes,
    "Web Call",
    (node) => nodeName(node) === "web call" || nodeName(node) === "web call trigger",
  );
  const promptNode = findRequiredNode(inspection.nodes, "Prompt", (node) => node.type === "prompt" || nodeName(node) === "prompt");
  const voiceNode = findRequiredNode(
    inspection.nodes,
    "Inbound Voice Agent",
    (node) => nodeName(node) === "inbound voice agent",
  );

  await configurePromptNode(client, inspection.latestVersion.id, promptNode, prompt);
  await configureVoiceAgentNode(client, inspection.latestVersion.id, voiceNode, webCallNode);
  await configureToolNodes(client, inspection.latestVersion.id, promptNode, mcpCredentialId);

  return inspectLatestNodes(client, inspection.latestVersion.id);
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

function mcpServerName(server: McpServer) {
  return server.server_name ?? server.name;
}

function mcpServerSortTime(server: McpServer) {
  const timestamp = server.last_connected_at ?? server.updated_at ?? server.created_at;
  return timestamp ? Date.parse(timestamp) || 0 : 0;
}

function newestMcpServer(servers: McpServer[]) {
  return [...servers].sort((a, b) => mcpServerSortTime(b) - mcpServerSortTime(a))[0];
}

async function registerMcp(client: HappyRobotClient, url: string, dryRun: boolean) {
  if (dryRun) {
    console.log(`Would register MCP server "${MCP_SERVER_NAME}" at ${url}`);
    return null;
  }

  const { data } = await client.mcp.list();
  const matches = (data as McpServer[]).filter((server) => mcpServerMatchesUrl(server, url) && mcpServerName(server) === MCP_SERVER_NAME);
  const existing = newestMcpServer(matches);
  if (matches.length > 1) {
    console.log(`Found ${matches.length} MCP server registrations for ${redactMcpUrl(url)}; using newest ${mcpServerId(existing)}.`);
  }
  const server = existing ?? (await client.mcp.create(mcpPayload(url)));
  const id = mcpServerId(server as McpServer);

  if (id) {
    await client.mcp.refresh(id);
  }

  return server;
}

async function publishVersion(client: HappyRobotClient, workflowId: string, versionId: string) {
  try {
    await client.versions.publish(versionId, { environment: happyRobotEnvironment() });
  } catch (error) {
    const message = describeSdkError(error);
    if (message.includes("Version is already live")) {
      console.log(`Workflow ${workflowId} version ${versionId} is already live.`);
      return;
    }

    if (!message.includes("already has a live version")) {
      throw error;
    }

    await client.workflows.unpublish(workflowId);
    await client.versions.publish(versionId, { environment: happyRobotEnvironment() });
  }
  console.log(`Published workflow ${workflowId} version ${versionId}`);
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
  await client.workflows.update(created.workflow.id, {
    name: WORKFLOW_NAME,
    description: WORKFLOW_DESCRIPTION,
  });
  console.log(`Created workflow ${created.workflow.id}`);
  return created.workflow;
}

async function ignoreWorkflowCleanupError(action: string, workflow: WorkflowReference, error: unknown) {
  const message = describeSdkError(error);
  if (message.includes("404") || message.toLowerCase().includes("not found")) {
    return;
  }
  console.log(`Could not ${action} workflow ${workflow.id} before deletion: ${message}`);
}

async function deleteWorkflow(client: HappyRobotClient, workflow: WorkflowReference) {
  console.log(`Deleting existing workflow ${workflow.id} (${workflow.name}) before recreating it.`);

  try {
    await client.workflows.cancelRuns(workflow.id);
  } catch (error) {
    await ignoreWorkflowCleanupError("cancel runs for", workflow, error);
  }

  try {
    await client.workflows.unpublish(workflow.id);
  } catch (error) {
    await ignoreWorkflowCleanupError("unpublish", workflow, error);
  }

  await client.workflows.delete(workflow.id);
  console.log(`Deleted workflow ${workflow.id}`);
}

async function resolveWorkflow(client: HappyRobotClient, prompt: string): Promise<WorkflowReference> {
  const workflowId = process.env.HAPPYROBOT_WORKFLOW_ID;
  const existing = workflowId ? await findWorkflowById(client, workflowId) : await findWorkflowByName(client, WORKFLOW_NAME);

  if (existing) {
    await deleteWorkflow(client, existing as WorkflowReference);
  } else if (workflowId) {
    console.log(`Workflow ${workflowId} was not found; creating a replacement workflow.`);
  }

  return createWorkflow(client, prompt);
}

function dryRunWorkflow(): WorkflowReference {
  console.log(`Would delete the existing inbound voice workflow if present, then create "${WORKFLOW_NAME}" from template.`);
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
  console.log(`MCP URL: ${redactMcpUrl(input.mcpUrl)}`);
  console.log(`API base URL: ${input.apiBaseUrl}`);
  console.log("1. Open the workflow in HappyRobot Builder.");
  console.log("2. Confirm it has Web Call -> Inbound Voice Agent -> Prompt -> tool nodes.");
  console.log("3. Confirm the registered MCP server named \"Carrier Sales Hono MCP\" is attached to the tool nodes.");
  console.log(`4. Store this new workflow ID in HAPPYROBOT_WORKFLOW_ID: ${input.workflowId}`);
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

  const mcpServer = await registerMcp(client, url, options.dryRun);
  const mcpCredentialId = mcpServer ? mcpServerId(mcpServer as McpServer) : undefined;

  let nodes: unknown[] = [];
  let configuredVersionId: string | undefined;
  if (!options.dryRun) {
    if (!mcpCredentialId) {
      throw new Error("Cannot configure MCP Call nodes because the registered MCP server did not return a credential ID.");
    }
    try {
      const inspection = await configureWorkflowNodes(client, workflow.id, prompt, mcpCredentialId);
      nodes = inspection.nodes;
      if (inspection.latestVersion?.id) {
        configuredVersionId = inspection.latestVersion.id;
        console.log(`Latest version: ${inspection.latestVersion.id}`);
        console.log(`Configured and inspected ${nodes.length} workflow nodes.`);
      }
    } catch (error) {
      console.log(`Node configuration skipped: ${describeSdkError(error)}`);
    }
  } else {
    console.log("Would configure Prompt, Inbound Voice Agent, tool nodes, and child MCP Call nodes from the latest workflow version.");
  }

  if (options.publish && !options.dryRun) {
    if (!configuredVersionId) {
      throw new Error("Cannot publish because node configuration did not return a version ID.");
    }
    await publishVersion(client, workflow.id, configuredVersionId);
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
