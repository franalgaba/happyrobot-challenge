import { useRef, useState } from "react";
import { HappyRobotVoiceClient } from "@happyrobot-ai/sdk/voice";
import type { VoiceConnection } from "@happyrobot-ai/sdk/voice";
import type { VoiceTokenResponse } from "@happyrobot-challenge/shared";
import { fetchVoiceToken } from "../lib/voice-token";

type CallStatus = "idle" | "connecting" | "connected" | "error";

type DemoScriptStep = {
  label: string;
  value?: string;
  detail?: string;
};

const DEMO_MC_NUMBER = "585242";

const DEMO_SCRIPT_STEPS: DemoScriptStep[] = [
  {
    label: "MC number",
    value: DEMO_MC_NUMBER,
    detail: "Live FMCSA — Corbin & Whetstone Trucking LLC",
  },
  { label: "Lane", detail: "Atlanta → Dallas dry van" },
  { label: "Counter", value: "$2,600" },
  { label: "Close", detail: "Accept the counter, then wrap up after transfer" },
];

type DemoCallLauncherProps = {
  onCallEnded?: () => void;
};

function DemoCallScript() {
  return (
    <div className="demo-call-script">
      <p className="demo-call-script-label">What to say</p>
      <ol className="demo-script-steps">
        {DEMO_SCRIPT_STEPS.map((step, index) => (
          <li key={step.label} className="demo-script-step">
            <span className="demo-script-step-num" aria-hidden>
              {index + 1}
            </span>
            <div className="demo-script-step-body">
              <span className="demo-script-step-label">{step.label}</span>
              {step.value ? (
                <span className="demo-script-step-value mono">{step.value}</span>
              ) : null}
              {step.detail ? (
                <span className="demo-script-step-detail">{step.detail}</span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function DemoCallLauncher({ onCallEnded }: DemoCallLauncherProps) {
  const connectionRef = useRef<VoiceConnection | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [muted, setMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function startCall() {
    setStatus("connecting");
    setErrorMessage(null);

    try {
      const tokenResponse: VoiceTokenResponse = await fetchVoiceToken();

      const voiceConfig = {
        url: tokenResponse.url,
        token: tokenResponse.token,
        room_name: tokenResponse.room_name,
      };

      const voice = new HappyRobotVoiceClient(voiceConfig);

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
      <p className="demo-call-script-label demo-call-eyebrow">Live demonstration</p>

      {isConnecting && !isConnected ? (
        <p className="demo-call-status" role="status" aria-live="polite">
          Connecting to agent…
        </p>
      ) : null}

      {isConnected ? (
        <>
          <p className="demo-call-status demo-call-status--live" role="status" aria-live="polite">
            <span className="demo-call-live-dot" aria-hidden />
            Live with carrier agent
          </p>
          <p className="demo-call-hint">End the call when finished—metrics refresh automatically.</p>
        </>
      ) : null}

      {!isConnected && !isConnecting ? (
        <>
          <p className="demo-call-hint">
            Talk to the inbound carrier agent in your browser. Metrics update when the call ends.
          </p>
          {status === "error" && errorMessage ? (
            <p className="demo-call-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </>
      ) : null}

      <DemoCallScript />

      <div className="demo-call-controls">
        {isConnected ? (
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
        ) : (
          <button
            type="button"
            className="demo-call-btn demo-call-btn--primary"
            onClick={startCall}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting…" : "Start demo call"}
          </button>
        )}
      </div>
    </aside>
  );
}
