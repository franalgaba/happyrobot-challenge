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

  const subtitle =
    view === "review"
      ? "Follow-ups, human review, and negative sentiment"
      : "Newest finalized conversations—outcome, sentiment, negotiation, and rate";

  const emptyTitle = view === "review" ? "Nothing needs review" : "No calls recorded yet";
  const emptyBody =
    view === "review"
      ? "Calls flagged for follow-up or human review will appear here."
      : "When a carrier conversation is finalized, outcomes and rates will appear here.";

  function selectView(nextView: CallsView) {
    setView(nextView);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentView: CallsView) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") {
      return;
    }

    event.preventDefault();
    if (event.key === "Home" || event.key === "ArrowLeft") {
      selectView("recent");
      return;
    }
    if (event.key === "End" || event.key === "ArrowRight") {
      selectView("review");
      return;
    }
    selectView(currentView === "recent" ? "review" : "recent");
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
              onClick={() => selectView("recent")}
              onKeyDown={(event) => handleTabKeyDown(event, "recent")}
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
              onClick={() => selectView("review")}
              onKeyDown={(event) => handleTabKeyDown(event, "review")}
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
