import { useId, useMemo, useState, type KeyboardEvent } from "react";
import type { CallRecord, LoadRecord, NegotiationRecord } from "@happyrobot-challenge/shared";
import { callNeedsReview } from "../lib/dashboard-metrics";
import { CallsTable } from "./CallsTable";

type CallsView = "recent" | "review";

type CallsWorkSectionProps = {
  calls: CallRecord[];
  loads: LoadRecord[];
  negotiations: NegotiationRecord[];
};

const VIEW_COPY: Record<
  CallsView,
  { subtitle: string; emptyTitle: string; emptyBody: string }
> = {
  recent: {
    subtitle: "Newest finalized conversations—outcome, sentiment, negotiation, and rate",
    emptyTitle: "No calls recorded yet",
    emptyBody: "When a carrier conversation is finalized, outcomes and rates will appear here.",
  },
  review: {
    subtitle: "Follow-ups, human review, and negative sentiment",
    emptyTitle: "Nothing needs review",
    emptyBody: "Calls flagged for follow-up or human review will appear here.",
  },
};

const TAB_NAVIGATION_KEYS = new Set(["ArrowRight", "ArrowLeft", "Home", "End"]);

function viewFromNavigationKey(key: string): CallsView | null {
  if (key === "Home" || key === "ArrowLeft") return "recent";
  if (key === "End" || key === "ArrowRight") return "review";
  return null;
}

export function CallsWorkSection({ calls, loads, negotiations }: CallsWorkSectionProps) {
  const [view, setView] = useState<CallsView>("recent");
  const recentTabId = useId();
  const reviewTabId = useId();
  const panelId = useId();
  const reviewCount = useMemo(() => calls.filter(callNeedsReview).length, [calls]);

  const visibleCalls = useMemo(() => {
    if (view === "review") {
      return calls.filter(callNeedsReview);
    }
    return calls;
  }, [calls, view]);

  const { subtitle, emptyTitle, emptyBody } = VIEW_COPY[view];

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!TAB_NAVIGATION_KEYS.has(event.key)) return;

    event.preventDefault();
    const nextView = viewFromNavigationKey(event.key);
    if (nextView) setView(nextView);
  }

  return (
    <section className="report-section calls-work hr-enter" aria-labelledby="calls-heading">
      <header className="report-section-head">
        <div className="calls-work-head">
          <div>
            <h2 id="calls-heading">Calls</h2>
            <p>{subtitle}</p>
          </div>
          <div className="segmented-control" role="tablist" aria-label="Call list view">
            <button
              type="button"
              role="tab"
              id={recentTabId}
              aria-selected={view === "recent"}
              aria-controls={panelId}
              tabIndex={view === "recent" ? 0 : -1}
              className={`segmented-control-btn${view === "recent" ? " is-active" : ""}`}
              onClick={() => setView("recent")}
              onKeyDown={handleTabKeyDown}
            >
              Recent
              <span className="segmented-control-count mono">{calls.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              id={reviewTabId}
              aria-selected={view === "review"}
              aria-controls={panelId}
              tabIndex={view === "review" ? 0 : -1}
              className={`segmented-control-btn${view === "review" ? " is-active" : ""}`}
              onClick={() => setView("review")}
              onKeyDown={handleTabKeyDown}
            >
              Needs review
              <span className="segmented-control-count mono">{reviewCount}</span>
            </button>
          </div>
        </div>
      </header>
      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={view === "recent" ? recentTabId : reviewTabId}
        tabIndex={0}
        className="calls-work-panel"
      >
        <CallsTable
          calls={visibleCalls}
          loads={loads}
          negotiations={negotiations}
          emptyTitle={emptyTitle}
          emptyBody={emptyBody}
        />
      </div>
    </section>
  );
}
