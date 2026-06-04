import { useRef, useState } from "react";
import { HappyRobotVoiceClient } from "@happyrobot-ai/sdk/voice";
import type { VoiceConnection } from "@happyrobot-ai/sdk/voice";
import type { VoiceTokenResponse } from "@happyrobot-challenge/shared";
import { fetchVoiceToken } from "../lib/voice-token";

type CallStatus = "idle" | "connecting" | "connected" | "error";

type DemoCallLauncherProps = {
  onCallEnded?: () => void;
};

export function DemoCallLauncher({ onCallEnded }: DemoCallLauncherProps) {
  const connectionRef = useRef<VoiceConnection | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [muted, setMuted] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function startCall() {
    setStatus("connecting");
    setErrorMessage(null);

    try {
      const tokenResponse: VoiceTokenResponse = await fetchVoiceToken();
      setRunId(tokenResponse.run_id);

      const voice = new HappyRobotVoiceClient({
        url: tokenResponse.url,
        token: tokenResponse.token,
      });

      const connection = await voice.connect({
        onConnected: () => setStatus("connected"),
        onDisconnected: () => {
          setStatus("idle");
          setMuted(false);
          connectionRef.current = null;
          onCallEnded?.();
        },
        onAgentConnected: (participant) => {
          console.log("Agent joined:", participant.identity);
        },
        onReconnecting: () => setStatus("connecting"),
        onReconnected: () => setStatus("connected"),
        onError: (error) => {
          console.error(error);
          setErrorMessage("The voice connection was interrupted.");
          setStatus("error");
        },
      });

      connectionRef.current = connection;
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Could not start the demo call.",
      );
      setStatus("error");
    }
  }

  async function endCall() {
    await connectionRef.current?.disconnect();
    connectionRef.current = null;
    setStatus("idle");
    setMuted(false);
    onCallEnded?.();
  }

  async function toggleMute() {
    const connection = connectionRef.current;
    if (!connection) return;

    if (muted) {
      await connection.unmute();
      setMuted(false);
      return;
    }

    await connection.mute();
    setMuted(true);
  }

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <aside className="demo-call" aria-label="Live demo call">
      <p className="demo-call-eyebrow">Live demonstration</p>

      {isConnected ? (
        <>
          <p className="demo-call-status demo-call-status--live" role="status">
            <span className="demo-call-live-dot" aria-hidden />
            In call
            {runId ? (
              <>
                {" "}
                · <span className="mono">Run {runId}</span>
              </>
            ) : null}
          </p>
          <div className="demo-call-controls">
            <div className="demo-call-actions">
              <button
                type="button"
                className="demo-call-btn demo-call-btn--secondary"
                onClick={toggleMute}
              >
                {muted ? "Unmute" : "Mute"}
              </button>
              <button type="button" className="demo-call-btn demo-call-btn--primary" onClick={endCall}>
                End call
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="demo-call-hint">
            Talk to the inbound carrier agent in your browser—metrics below update when the call
            ends.
          </p>
          <div className="demo-call-controls">
            <button
              type="button"
              className="demo-call-btn demo-call-btn--primary"
              onClick={startCall}
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting…" : "Start demo call"}
            </button>
            {status === "error" && errorMessage ? (
              <p className="demo-call-error" role="alert">
                {errorMessage}
              </p>
            ) : null}
          </div>
        </>
      )}

      <details className="demo-call-script">
        <summary>Demo script</summary>
        <ol>
          <li>
            MC number: <span className="mono">123456</span>
          </li>
          <li>Lane: Atlanta to Dallas dry van</li>
          <li>
            Counter: <span className="mono">$2600</span>
          </li>
          <li>Accept the counter, then wrap up after a successful transfer</li>
        </ol>
      </details>
    </aside>
  );
}
