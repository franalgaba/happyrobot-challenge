> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Resources

> Manage contacts, knowledge bases, variables, MCP servers, billing, and API keys

Access platform resources like contacts, knowledge bases, and billing data through dedicated sub-clients.

## Contacts

Look up contacts and view their interaction history. Use this to search for contacts by name, resolve them by phone number or email, and retrieve their call/message history.

| Method                       | HTTP                             | Description                                |
| ---------------------------- | -------------------------------- | ------------------------------------------ |
| `list(query?)`               | `GET /contacts`                  | List contacts (cursor-paginated)           |
| `resolve(query)`             | `GET /contacts/resolve`          | Look up a contact by phone number or email |
| `get(contactId)`             | `GET /contacts/:id`              | Get contact by ID                          |
| `getInteractions(contactId)` | `GET /contacts/:id/interactions` | Get call/message history for a contact     |
| `getMemories(contactId)`     | `GET /contacts/:id/memories`     | Get AI memories for a contact              |

```ts theme={null}
const { data } = await client.contacts.list({ search: "John" });
const contact = await client.contacts.resolve({ phone_number: "+14155551234" });
const contact = await client.contacts.get("contact-id");
const interactions = await client.contacts.getInteractions("contact-id");
const memories = await client.contacts.getMemories("contact-id");
```

***

## Knowledge bases

Manage knowledge base documents for agent RAG. Use this to upload files, trigger processing, and manage knowledge bases that your agents reference during conversations.

| Method                      | HTTP                                         | Description                         |
| --------------------------- | -------------------------------------------- | ----------------------------------- |
| `list()`                    | `GET /knowledge-bases`                       | List all knowledge bases            |
| `create(body)`              | `POST /knowledge-bases`                      | Create a new knowledge base         |
| `listFiles(kbId)`           | `GET /knowledge-bases/:id/files`             | List documents in a knowledge base  |
| `getUploadUrls(kbId, body)` | `POST /knowledge-bases/:id/upload-urls`      | Get pre-signed S3 upload URLs       |
| `triggerChunking(kbId)`     | `POST /knowledge-bases/:id/trigger-chunking` | Start document processing/chunking  |
| `deleteFile(kbId, fileId)`  | `DELETE /knowledge-bases/:id/files/:fileId`  | Delete a file from a knowledge base |
| `delete(kbId)`              | `DELETE /knowledge-bases/:id`                | Delete a knowledge base             |

```ts theme={null}
const kbs = await client.knowledgeBases.list();

// Create a knowledge base
const kb = await client.knowledgeBases.create({ name: "Support Docs", description: "Customer support articles" });

const files = await client.knowledgeBases.listFiles("kb-id");

// Upload a file
const urls = await client.knowledgeBases.getUploadUrls("kb-id", {
  files: [{ name: "doc.pdf", content_type: "application/pdf" }],
});
// ... upload to the pre-signed URL ...
await client.knowledgeBases.triggerChunking("kb-id");

await client.knowledgeBases.deleteFile("kb-id", "file-id");
await client.knowledgeBases.delete("kb-id");
```

***

## Variables

Workflow-scoped variables for dynamic configuration. Use these to store key-value pairs that your workflow nodes can reference at runtime.

| Method                                 | HTTP                                    | Description                   |
| -------------------------------------- | --------------------------------------- | ----------------------------- |
| `list(workflowId, query?)`             | `GET /workflows/:wId/variables`         | List variables for a workflow |
| `create(workflowId, body)`             | `POST /workflows/:wId/variables`        | Create a variable             |
| `update(workflowId, variableId, body)` | `PATCH /workflows/:wId/variables/:vId`  | Update a variable             |
| `delete(workflowId, variableId)`       | `DELETE /workflows/:wId/variables/:vId` | Delete a variable             |

```ts theme={null}
const { data } = await client.variables.list("workflow-id");
await client.variables.create("workflow-id", { name: "MY_VAR", value: "hello" });
await client.variables.update("workflow-id", "variable-id", { value: "world" });
await client.variables.delete("workflow-id", "variable-id");
```

***

## MCP servers

Register and manage MCP servers. Use this to connect external tool servers that your agents can invoke during conversations.

| Method           | HTTP                    | Description                         |
| ---------------- | ----------------------- | ----------------------------------- |
| `list(query?)`   | `GET /mcp`              | List MCP servers (paginated)        |
| `create(body)`   | `POST /mcp`             | Register a new MCP server           |
| `refresh(mcpId)` | `POST /mcp/:id/refresh` | Re-discover tools for an MCP server |

```ts theme={null}
const { data } = await client.mcp.list();
await client.mcp.create({ name: "My MCP", url: "https://..." });
await client.mcp.refresh("mcp-id");
```

***

## Billing

Query billing details and totals. Use this to retrieve itemized billing line items or aggregated totals for a date range.

| Method              | HTTP                         | Description                 |
| ------------------- | ---------------------------- | --------------------------- |
| `getDetails(query)` | `GET /billing/usage/details` | Detailed billing line items |
| `getTotals(query)`  | `GET /billing/usage/totals`  | Aggregated billing totals   |

```ts theme={null}
const details = await client.billing.getDetails({
  start: "2024-01-01",
  end: "2024-01-31",
});
const totals = await client.billing.getTotals({
  start: "2024-01-01",
  end: "2024-01-31",
});
```

***

## API key

Introspect the current API key. Use this to verify which key is active and retrieve its associated metadata.

| Method       | HTTP                    | Description                                          |
| ------------ | ----------------------- | ---------------------------------------------------- |
| `describe()` | `GET /api-key/describe` | Introspect the current API key (ID, name, org, etc.) |

```ts theme={null}
const info = await client.apiKey.describe();
console.log(info); // { id, name, org_id, ... }
```