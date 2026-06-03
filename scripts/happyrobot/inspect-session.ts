import { HappyRobotClient } from "@happyrobot-ai/sdk";
import { describeSdkError } from "./sdk-errors";

const DEFAULT_API_BASE_URL = "http://localhost:3000";
const TRANSCRIPT_SUMMARY_LENGTH = 500;
const INSPECTOR_SOURCE = "scripts/happyrobot/inspect-session.ts";

function argValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function happyRobotCluster() {
  return process.env.HAPPYROBOT_CLUSTER === "eu" ? "eu" : "us";
}

function classifyOutcome(transcript: string) {
  const lower = transcript.toLowerCase();
  if (lower.includes("transfer was successful")) return "booked";
  if (lower.includes("not eligible") || lower.includes("ineligible")) return "ineligible";
  if (lower.includes("no matching") || lower.includes("no viable")) return "no_match";
  if (lower.includes("cannot accept") || lower.includes("declined")) return "rejected";
  return "human_review";
}

function transcriptIncludesAny(transcript: string, phrases: string[]) {
  const lower = transcript.toLowerCase();
  return phrases.some((phrase) => lower.includes(phrase));
}

function classifySentiment(transcript: string) {
  if (transcriptIncludesAny(transcript, ["great", "sounds good", "thank"])) return "positive";
  if (transcriptIncludesAny(transcript, ["frustrated", "bad", "too low"])) return "negative";
  return "neutral";
}

function buildFinalizePayload(input: { runId: string; sessionId: string; transcript: string }) {
  return {
    happyrobotRunId: input.runId,
    happyrobotSessionId: input.sessionId,
    outcome: classifyOutcome(input.transcript),
    sentiment: classifySentiment(input.transcript),
    transcript: input.transcript,
    summary: input.transcript.slice(0, TRANSCRIPT_SUMMARY_LENGTH),
    transferMock: input.transcript.includes("Transfer was successful"),
    extractedData: { source: INSPECTOR_SOURCE },
  };
}

async function maybeFinalize(input: {
  apiBaseUrl: string;
  apiKey: string;
  runId: string;
  sessionId: string;
  transcript: string;
}) {
  const response = await fetch(`${input.apiBaseUrl.replace(/\/$/, "")}/api/tools/finalize-call`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": input.apiKey,
    },
    body: JSON.stringify(buildFinalizePayload(input)),
  });

  if (!response.ok) {
    throw new Error(`Finalize call failed with status ${response.status}: ${await response.text()}`);
  }
  console.log(await response.text());
}

function formatTranscript(messages: Array<{ role?: string; content?: string }>) {
  return messages.map((message) => `[${message.role}] ${message.content}`).join("\n");
}

async function printAndMaybeFinalizeSession(input: {
  client: HappyRobotClient;
  session: { id: string; type?: string; status?: string };
  shouldFinalize: boolean;
  apiBaseUrl: string;
  internalApiKey: string | undefined;
  runId: string;
}) {
  const { data: messages } = await input.client.sessions.getMessages(input.session.id);
  const transcript = formatTranscript(messages);

  console.log(`\nSession ${input.session.id} (${input.session.type ?? "unknown"} / ${input.session.status ?? "unknown"})`);
  console.log(transcript);

  if (input.shouldFinalize) {
    await maybeFinalize({
      apiBaseUrl: input.apiBaseUrl,
      apiKey: required("API_KEY", input.internalApiKey),
      runId: input.runId,
      sessionId: input.session.id,
      transcript,
    });
  }
}

async function main() {
  const apiKey = required("HAPPYROBOT_API_KEY", process.env.HAPPYROBOT_API_KEY);
  const runId = required("--run-id", argValue("--run-id"));
  const shouldFinalize = process.argv.includes("--finalize");
  const apiBaseUrl = process.env.PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  const internalApiKey = process.env.API_KEY;

  const client = new HappyRobotClient({ apiKey, cluster: happyRobotCluster(), timeout: 30_000, maxRetries: 2 });
  const sessions = await client.runs.getSessions(runId);
  const sessionList = Array.isArray(sessions) ? sessions : (sessions as { data?: unknown[] }).data ?? [];

  for (const session of sessionList as Array<{ id: string; type?: string; status?: string }>) {
    await printAndMaybeFinalizeSession({ client, session, shouldFinalize, apiBaseUrl, internalApiKey, runId });
  }

  const streamSessionId = argValue("--stream-session-id");
  if (streamSessionId) {
    const stream = await client.sessions.stream(streamSessionId);
    for await (const event of stream) {
      console.log(JSON.stringify(event));
      if (event.event === "session_ended") break;
    }
  }
}

main().catch((error) => {
  console.error(describeSdkError(error));
  process.exit(1);
});
