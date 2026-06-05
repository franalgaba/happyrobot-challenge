import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
    <ol className="demo-script-steps">
      {DEMO_SCRIPT_STEPS.map((step, index) => (
        <li key={step.label} className="demo-script-step">
          <span className="demo-script-step-num" aria-hidden>
            {index + 1}
          </span>
          <div className="demo-script-step-body">
            <span className="demo-script-step-label">{step.label}</span>
            {step.value ? <span className="demo-script-step-value mono">{step.value}</span> : null}
            {step.detail ? <span className="demo-script-step-detail">{step.detail}</span> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function demoScriptScreenReaderText() {
  return DEMO_SCRIPT_STEPS.map((step, index) => {
    const parts = [step.label, step.value, step.detail].filter(Boolean);
    return `${index + 1}. ${parts.join(". ")}`;
  }).join(" ");
}

const TOOLTIP_HIDE_DELAY_MS = 100;
const TOOLTIP_EXIT_MS = 170;

function DemoScriptTooltip() {
  const tooltipId = useId();
  const descriptionId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  function clearHideTimeout() {
    if (hideTimeoutRef.current != null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }

  function updatePosition() {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const tooltipWidth = Math.min(320, window.innerWidth - 32);
    const left = Math.min(Math.max(16, rect.right - tooltipWidth), window.innerWidth - tooltipWidth - 16);

    setPosition({
      top: rect.bottom + 10,
      left,
    });
  }

  function toggleTooltip() {
    if (visible) {
      clearHideTimeout();
      setVisible(false);
      return;
    }
    showTooltip();
  }

  function handleTriggerClick() {
    if (window.matchMedia("(hover: none)").matches) {
      toggleTooltip();
    }
  }

  function showTooltip() {
    clearHideTimeout();
    updatePosition();
    setMounted(true);
    window.requestAnimationFrame(() => setVisible(true));
  }

  function scheduleHide() {
    clearHideTimeout();
    hideTimeoutRef.current = window.setTimeout(() => {
      setVisible(false);
    }, TOOLTIP_HIDE_DELAY_MS);
  }

  useEffect(() => {
    if (!mounted || visible) return;

    const unmountTimer = window.setTimeout(() => setMounted(false), TOOLTIP_EXIT_MS);
    return () => window.clearTimeout(unmountTimer);
  }, [mounted, visible]);

  useEffect(() => {
    if (!mounted) return;

    function handleResize() {
      updatePosition();
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mounted]);

  useEffect(() => () => clearHideTimeout(), []);

  return (
    <>
      <p id={descriptionId} className="visually-hidden">
        {demoScriptScreenReaderText()}
      </p>
      <button
        ref={triggerRef}
        type="button"
        className="demo-call-script-trigger"
        aria-expanded={visible}
        aria-describedby={descriptionId}
        aria-controls={visible ? tooltipId : undefined}
        onMouseEnter={showTooltip}
        onMouseLeave={scheduleHide}
        onClick={handleTriggerClick}
        onFocus={showTooltip}
        onBlur={(event) => {
          if (!tooltipRef.current?.contains(event.relatedTarget as Node)) {
            scheduleHide();
          }
        }}
      >
        Demo script
      </button>
      {mounted
        ? createPortal(
            <div
              ref={tooltipRef}
              id={tooltipId}
              role="tooltip"
              className={`demo-script-tooltip${visible ? " is-visible" : ""}`}
              style={{ top: position.top, left: position.left }}
              onMouseEnter={showTooltip}
              onMouseLeave={scheduleHide}
            >
              <p className="demo-script-tooltip-label">What to say</p>
              <DemoCallScript />
            </div>,
            document.body,
          )
        : null}
    </>
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

      const { HappyRobotVoiceClient } = await import("@happyrobot-ai/sdk/voice");
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
      setErrorMessage(error instanceof Error ? error.message : "Could not start the demo call.");
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
    <div className="demo-call" aria-label="Live demo call">
      {isConnecting && !isConnected ? (
        <p className="demo-call-status" role="status" aria-live="polite">
          Connecting…
        </p>
      ) : null}

      {isConnected ? (
        <p className="demo-call-status demo-call-status--live" role="status" aria-live="polite">
          <span className="demo-call-live-dot" aria-hidden />
          Live with agent
        </p>
      ) : null}

      {status === "error" && errorMessage ? (
        <p className="demo-call-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="demo-call-actions">
        {isConnected ? (
          <>
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
          </>
        ) : (
          <>
            <button
              type="button"
              className="demo-call-btn demo-call-btn--primary"
              onClick={startCall}
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting…" : "Start demo call"}
            </button>
            {!isConnecting ? <DemoScriptTooltip /> : null}
          </>
        )}
      </div>
    </div>
  );
}
