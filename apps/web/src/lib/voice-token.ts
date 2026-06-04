import type { VoiceTokenResponse } from "@happyrobot-challenge/shared";

async function voiceTokenErrorMessage(response: Response): Promise<string> {
  const body = await response.text();
  try {
    const json = JSON.parse(body) as { error?: { message?: string }; message?: string };
    return json.error?.message ?? json.message ?? body;
  } catch {
    return body || `Request failed (${response.status})`;
  }
}

export async function fetchVoiceToken(): Promise<VoiceTokenResponse> {
  const response = await fetch("/api/voice/token", { method: "POST" });

  if (!response.ok) {
    throw new Error(await voiceTokenErrorMessage(response));
  }

  return response.json() as Promise<VoiceTokenResponse>;
}
