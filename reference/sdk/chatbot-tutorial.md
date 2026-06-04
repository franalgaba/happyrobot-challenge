> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Chatbot tutorial

> Build a custom chat UI with the TypeScript SDK using React and Express

This tutorial walks through building a full-stack chatbot application using `@happyrobot-ai/sdk`. You'll create a backend server that securely issues chat tokens and a React frontend that connects via WebSocket for real-time messaging.

The finished project is available at [github.com/happyrobot-ai/chatbot-sdk-example](https://github.com/happyrobot-ai/chatbot-sdk-example) — clone it to skip ahead or use it as a reference.

## Architecture

The SDK uses a **two-tier auth model**:

1. **Your server** creates a scoped client token using your API key (keeps the key secret).
2. **The browser** uses `HappyRobotChatClient` with that short-lived token for all chat operations.

The flow looks like this:

1. The browser requests a token from your server
2. Your server exchanges the API key for a scoped JWT via `client.chat.createToken()`
3. The browser creates a session and opens a WebSocket connection
4. Messages are exchanged in real time over the WebSocket

## Prerequisites

* Node.js 18+
* A HappyRobot API key (`sk_live_...`)
* A workflow ID with a chat-enabled agent

## Steps

<Steps>
  <Step title="Set up the project">
    Create the project structure with separate `server` and `client` directories:

    ```bash theme={null}
    mkdir chatbot-example && cd chatbot-example
    mkdir server client
    ```

    Initialize and install server dependencies:

    <CodeGroup>
      ```bash npm theme={null}
      cd server && npm init -y
      npm install express cors @happyrobot-ai/sdk
      npm install -D typescript tsx @types/express @types/cors
      ```

      ```bash pnpm theme={null}
      cd server && pnpm init
      pnpm add express cors @happyrobot-ai/sdk
      pnpm add -D typescript tsx @types/express @types/cors
      ```

      ```bash yarn theme={null}
      cd server && yarn init -y
      yarn add express cors @happyrobot-ai/sdk
      yarn add -D typescript tsx @types/express @types/cors
      ```
    </CodeGroup>

    Initialize and install client dependencies:

    <CodeGroup>
      ```bash npm theme={null}
      cd ../client
      npm create vite@latest . -- --template react-ts
      npm install @happyrobot-ai/sdk
      ```

      ```bash pnpm theme={null}
      cd ../client
      pnpm create vite . --template react-ts
      pnpm add @happyrobot-ai/sdk
      ```

      ```bash yarn theme={null}
      cd ../client
      yarn create vite . --template react-ts
      yarn add @happyrobot-ai/sdk
      ```
    </CodeGroup>
  </Step>

  <Step title="Configure environment variables">
    Create `server/.env` with your API key and workflow ID:

    ```bash theme={null}
    HAPPYROBOT_API_KEY=sk_live_...
    WORKFLOW_ID=your-workflow-id
    PORT=3001
    ```

    <Warning>
      Never expose your API key to the browser. The server acts as a secure proxy that exchanges the key for a scoped, short-lived token.
    </Warning>
  </Step>

  <Step title="Create the token server">
    Create `server/src/index.ts`. This Express server has a single endpoint that creates scoped chat tokens:

    ```ts server/src/index.ts theme={null}
    import express from "express";
    import cors from "cors";
    import { HappyRobotClient } from "@happyrobot-ai/sdk";

    const PORT = process.env.PORT ?? 3001;
    const API_KEY = process.env.HAPPYROBOT_API_KEY;
    const WORKFLOW_ID = process.env.WORKFLOW_ID;

    if (!API_KEY) {
      console.error("Missing HAPPYROBOT_API_KEY environment variable");
      process.exit(1);
    }

    if (!WORKFLOW_ID) {
      console.error("Missing WORKFLOW_ID environment variable");
      process.exit(1);
    }

    const client = new HappyRobotClient({ apiKey: API_KEY });

    const app = express();
    app.use(cors({ origin: "http://localhost:5173" }));
    app.use(express.json());

    app.post("/api/chat/token", async (_req, res) => {
      try {
        const { token, expires_at } = await client.chat.createToken({
          workflow_id: WORKFLOW_ID,
          // Optional. Token lifetime in seconds.
          // Default 3600 (1 hour), min 60, max 86400 (24 hours).
          // ttl_seconds: 1800,
        });
        res.json({ token, expires_at });
      } catch (err) {
        console.error("Failed to create chat token:", err);
        res.status(500).json({ error: "Failed to create chat token" });
      }
    });

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
    ```

    Add a dev script to `server/package.json`:

    ```json theme={null}
    {
      "scripts": {
        "dev": "tsx --env-file=.env src/index.ts"
      }
    }
    ```
  </Step>

  <Step title="Build the chat client">
    Replace `client/src/App.tsx` with the chat UI. The client follows this lifecycle:

    1. Fetch a token from your server
    2. Create a `HappyRobotChatClient` with the token
    3. Create a session and connect via WebSocket
    4. Handle streaming responses and send messages

    ```ts client/src/App.tsx theme={null}
    import { useState, useRef, useCallback } from "react";
    import { HappyRobotChatClient } from "@happyrobot-ai/sdk/chat";
    import type { ChatConnection } from "@happyrobot-ai/sdk/chat";

    const SERVER_URL = "http://localhost:3001";

    interface Message {
      id: string;
      role: "user" | "assistant";
      content: string;
    }

    export function App() {
      const [messages, setMessages] = useState<Message[]>([]);
      const [input, setInput] = useState("");
      const [isConnected, setIsConnected] = useState(false);
      const [streamingContent, setStreamingContent] = useState("");

      const chatClientRef = useRef<HappyRobotChatClient | null>(null);
      const connectionRef = useRef<ChatConnection | null>(null);

      const connect = useCallback(async () => {
        // 1. Get a scoped token from your server
        const res = await fetch(`${SERVER_URL}/api/chat/token`, { method: "POST" });
        const { token } = await res.json();

        // 2. Initialize the browser-side client
        const chatClient = new HappyRobotChatClient({ token });
        chatClientRef.current = chatClient;

        // 3. Create a session
        const { session_id } = await chatClient.createSession();

        // 4. Connect via WebSocket and handle events
        const connection = chatClient.connect(session_id, {
          onConnected: () => setIsConnected(true),
          onResponseStart: () => setStreamingContent(""),
          onResponseChunk: (content) => {
            setStreamingContent((prev) => prev + content);
          },
          onResponseEnd: (content) => {
            setStreamingContent("");
            setMessages((prev) => [
              ...prev,
              { id: crypto.randomUUID(), role: "assistant", content },
            ]);
          },
          onSessionClosed: () => setIsConnected(false),
          // Auto-refresh the token before it expires so the connection
          // stays open without the user reconnecting.
          getToken: async () => {
            const res = await fetch(`${SERVER_URL}/api/chat/token`, {
              method: "POST",
            });
            const { token } = await res.json();
            return token;
          },
          // Backstop: only fires if no valid refresh arrived in time.
          onTokenExpired: () => setIsConnected(false),
        });

        connectionRef.current = connection;
      }, []);

      const sendMessage = useCallback(async () => {
        const content = input.trim();
        if (!content || !connectionRef.current) return;

        setInput("");
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "user", content },
        ]);

        // 5. Send messages over the WebSocket
        await connectionRef.current.sendMessage({ content });
      }, [input]);

      // ... render your UI
    }
    ```

    The key WebSocket events to handle:

    | Event              | Description                                                                                         |
    | ------------------ | --------------------------------------------------------------------------------------------------- |
    | `onConnected`      | WebSocket connection established                                                                    |
    | `onResponseStart`  | Agent started generating a response                                                                 |
    | `onResponseChunk`  | Partial response text (for streaming display)                                                       |
    | `onResponseEnd`    | Complete response text                                                                              |
    | `onSessionClosed`  | Session ended (by agent or user)                                                                    |
    | `getToken`         | Async callback to fetch a fresh token before the current one expires (enables transparent refresh)  |
    | `onTokenRefreshed` | Token was refreshed in-band — connection lifetime extended (optional, for logging)                  |
    | `onTokenExpired`   | Backstop — only fires if `getToken` is not provided or fails to deliver a valid token before expiry |

    <Tip>
      When `getToken` is provided, the SDK transparently refreshes the JWT \~30s before expiry by calling your handler and sending the new token over the WebSocket. The connection stays open the whole time — no reconnect needed. If you don't provide `getToken`, the connection will close at expiry and `onTokenExpired` will fire.
    </Tip>
  </Step>

  <Step title="Add file uploads">
    The SDK supports sending files alongside messages. Upload files with `chatClient.uploadFile()`, then attach the result to your message:

    ```ts theme={null}
    // Upload a file
    const artifact = await chatClient.uploadFile(
      fileBlob,       // File or Blob
      "photo.png",    // filename
      "image/png"     // MIME type
    );

    // Attach it to a message
    await connection.sendMessage({
      content: "Here's the document",
      artifacts: [artifact],
    });
    ```

    In a React component, you can wire this to a file input:

    ```ts theme={null}
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length || !chatClientRef.current) return;

      for (const file of Array.from(files)) {
        const result = await chatClientRef.current.uploadFile(
          file,
          file.name,
          file.type || "application/octet-stream"
        );
        // Store result.media_id to attach when sending
      }
    };
    ```
  </Step>

  <Step title="Pass data to the agent">
    You can forward context to the chat agent as trigger variables when the session starts. Pass a `data` object to `createToken()` on the server:

    ```ts theme={null}
    const { token, expires_at } = await client.chat.createToken({
      workflow_id: WORKFLOW_ID,
      data: {
        customer_name: "Jane Smith",
        account_id: "ACC-98765",
      },
    });
    ```

    The `data` is embedded in the token and forwarded as trigger variables when the agent session begins — useful for personalizing the agent's behavior based on who is chatting.
  </Step>

  <Step title="End a session">
    When the user is done chatting, close the session gracefully:

    ```ts theme={null}
    await connection.endSession();
    ```

    This notifies the server, triggers any post-session workflow logic, and closes the WebSocket connection.
  </Step>

  <Step title="Run the app">
    Start both the server and client in separate terminals:

    ```bash theme={null}
    # Terminal 1 — server (port 3001)
    cd server && npm run dev

    # Terminal 2 — client (port 5173)
    cd client && npm run dev
    ```

    Open [http://localhost:5173](http://localhost:5173) and click **Start Chat** to begin a conversation with your agent.
  </Step>
</Steps>

## Error handling

The SDK exports typed error classes for common failure scenarios:

```ts theme={null}
import { ApiError, AuthenticationError, NotFoundError } from "@happyrobot-ai/sdk";

try {
  await client.chat.createToken({ workflow_id: "bad-id" });
} catch (err) {
  if (err instanceof NotFoundError)        console.log("Workflow not found");
  else if (err instanceof AuthenticationError) console.log("Invalid API key");
  else if (err instanceof ApiError)        console.log(err.status, err.message);
}
```

## SDK reference

### Server-side — `HappyRobotClient`

| Method                                                                | Description                                                                       |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `client.chat.createToken({ workflow_id, data?, env?, ttl_seconds? })` | Create a scoped client token. `ttl_seconds` defaults to 3600 (min 60, max 86400). |

### Browser-side — `HappyRobotChatClient`

| Method                                      | Description                                               |
| ------------------------------------------- | --------------------------------------------------------- |
| `chat.createSession()`                      | Create a new chat session                                 |
| `chat.connect(sessionId, handlers)`         | Open a bidirectional WebSocket — returns `ChatConnection` |
| `chat.uploadFile(file, filename, mimeType)` | Upload a file for attachment                              |
| `chat.getHistory(sessionId)`                | Retrieve message history for a session                    |

### `ChatConnection`

| Method                                            | Description                              |
| ------------------------------------------------- | ---------------------------------------- |
| `connection.sendMessage({ content, artifacts? })` | Send a message over WebSocket            |
| `connection.endSession()`                         | End the session and close the connection |
| `connection.close()`                              | Close the WebSocket connection           |

## Next steps

* See [Sessions and messages](/developer-tools/sdk/sessions-and-messages) for the full list of WebSocket event types
* Check out the [complete example on GitHub](https://github.com/happyrobot-ai/chatbot-sdk-example) for the full React UI with file uploads, streaming display, and connection status handling
* Read the [Error handling](/developer-tools/sdk/error-handling) guide for more on SDK error types