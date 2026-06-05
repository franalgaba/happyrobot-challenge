import { useEffect, useId, useRef, useState, type FocusEvent } from "react";
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

type DemoCallLauncherProps = {
  onCallEnded?: () => void;
};

type TooltipPosition = {
  top: number;
  left: number;
};

const DEMO_MC_NUMBER = "585242";
const TOOLTIP_MAX_WIDTH_PX = 320;
const VIEWPORT_EDGE_PADDING_PX = 16;
const VIEWPORT_GUTTER_PX = 32;
const TOOLTIP_OFFSET_PX = 10;
const TOOLTIP_HIDE_DELAY_MS = 100;
const TOOLTIP_EXIT_MS = 170;

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

function isCoarsePointer(): boolean {
  return window.matchMedia("(hover: none)").matches;
}

function formatDemoScriptForScreenReader(): string {
  return DEMO_SCRIPT_STEPS.map((step, index) => {
    const parts = [step.label, step.value, step.detail].filter(Boolean);
    return `${index + 1}. ${parts.join(". ")}`;
  }).join(" ");
}

function computeTooltipPosition(trigger: HTMLElement): TooltipPosition {
  const rect = trigger.getBoundingClientRect();
  const tooltipWidth = Math.min(TOOLTIP_MAX_WIDTH_PX, window.innerWidth - VIEWPORT_GUTTER_PX);
  const left = Math.min(
    Math.max(VIEWPORT_EDGE_PADDING_PX, rect.right - tooltipWidth),
    window.innerWidth - tooltipWidth - VIEWPORT_EDGE_PADDING_PX,
  );

  return {
    top: rect.bottom + TOOLTIP_OFFSET_PX,
    left,
  };
}

function buildVoiceConfig(tokenResponse: VoiceTokenResponse) {
  return {
    url: tokenResponse.url,
    token: tokenResponse.token,
    room_name: tokenResponse.room_name,
  };
}

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

function DemoScriptTooltip() {
  const tooltipId = useId();
  const descriptionId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ top: 0, left: 0 });

  function clearHideTimeout() {
    if (hideTimeoutRef.current == null) return;

    window.clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = null;
  }

  function hideTooltip() {
    clearHideTimeout();
    setVisible(false);
  }

  function showTooltip() {
    const trigger = triggerRef.current;
    if (!trigger) return;

    clearHideTimeout();
    setPosition(computeTooltipPosition(trigger));
    setMounted(true);
    window.requestAnimationFrame(() => setVisible(true));
  }

  function scheduleHide() {
    clearHideTimeout();
    hideTimeoutRef.current = window.setTimeout(hideTooltip, TOOLTIP_HIDE_DELAY_MS);
  }

  function toggleTooltip() {
    if (visible) {
      hideTooltip();
      return;
    }
    showTooltip();
  }

  function handleTriggerClick() {
    if (isCoarsePointer()) {
      toggleTooltip();
    }
  }

  function handleTriggerBlur(event: FocusEvent<HTMLButtonElement>) {
    if (tooltipRef.current?.contains(event.relatedTarget as Node)) return;
    scheduleHide();
  }

  useEffect(() => {
    if (!mounted || visible) return;

    const unmountTimer = window.setTimeout(() => setMounted(false), TOOLTIP_EXIT_MS);
    return () => window.clearTimeout(unmountTimer);
  }, [mounted, visible]);

  useEffect(() => {
    if (!mounted) return;

    function handleResize() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      setPosition(computeTooltipPosition(trigger));
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mounted]);

  useEffect(() => () => clearHideTimeout(), []);

  return (
    <>
      <p id={descriptionId} className="visually-hidden">
        {formatDemoScriptForScreenReader()}
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
        onBlur={handleTriggerBlur}
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

type CallStatusBannerProps = {
  status: CallStatus;
  errorMessage: string | null;
};

function CallStatusBanner({ status, errorMessage }: CallStatusBannerProps) {
  if (status === "connecting") {
    return (
      <p className="demo-call-status" role="status" aria-live="polite">
        Connecting…
      </p>
    );
  }

  if (status === "connected") {
    return (
      <p className="demo-call-status demo-call-status--live" role="status" aria-live="polite">
        <span className="demo-call-live-dot" aria-hidden />
        Live with agent
      </p>
    );
  }

  if (status === "error" && errorMessage) {
    return (
      <p className="demo-call-error" role="alert">
        {errorMessage}
      </p>
    );
  }

  return null;
}

type CallActionButtonsProps = {
  status: CallStatus;
  muted: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
};

function CallActionButtons({
  status,
  muted,
  onStartCall,
  onEndCall,
  onToggleMute,
}: CallActionButtonsProps) {
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <div className="demo-call-actions">
      {isConnected ? (
        <>
          <button type="button" className="demo-call-btn demo-call-btn--secondary" onClick={onToggleMute}>
            {muted ? "Unmute" : "Mute"}
          </button>
          <button type="button" className="demo-call-btn demo-call-btn--primary" onClick={onEndCall}>
            End call
          </button>
        </>
      ) : (
        <button
          type="button"
          className="demo-call-btn demo-call-btn--primary"
          onClick={onStartCall}
          disabled={isConnecting}
        >
          {isConnecting ? "Connecting…" : "Start demo call"}
        </button>
      )}
      <DemoScriptTooltip />
    </div>
  );
}

export function DemoCallLauncher({ onCallEnded }: DemoCallLauncherProps) {
  const connectionRef = useRef<VoiceConnection | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [muted, setMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleDisconnect() {
    setStatus("idle");
    setMuted(false);
    connectionRef.current = null;
    onCallEnded?.();
  }

  function handleVoiceError(error: unknown) {
    console.error(error);
    setErrorMessage("The voice connection was interrupted.");
    setStatus("error");
  }

  async function startCall() {
    setStatus("connecting");
    setErrorMessage(null);

    try {
      const tokenResponse = await fetchVoiceToken();
      const { HappyRobotVoiceClient } = await import("@happyrobot-ai/sdk/voice");
      const voice = new HappyRobotVoiceClient(buildVoiceConfig(tokenResponse));

      const connection = await voice.connect({
        onConnected: () => setStatus("connected"),
        onDisconnected: handleDisconnect,
        onAgentConnected: (participant) => {
          console.log("Agent joined:", participant.identity);
        },
        onReconnecting: () => setStatus("connecting"),
        onReconnected: () => setStatus("connected"),
        onError: handleVoiceError,
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
    handleDisconnect();
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

  return (
    <div className="demo-call" aria-label="Live demo call">
      <CallStatusBanner status={status} errorMessage={errorMessage} />
      <CallActionButtons
        status={status}
        muted={muted}
        onStartCall={startCall}
        onEndCall={endCall}
        onToggleMute={toggleMute}
      />
    </div>
  );
}
