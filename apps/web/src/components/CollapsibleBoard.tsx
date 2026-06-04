import type { ReactNode } from "react";

type CollapsibleBoardProps = {
  id: string;
  title: string;
  count: number;
  hint: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function CollapsibleBoard({
  id,
  title,
  count,
  hint,
  children,
  defaultOpen = false,
}: CollapsibleBoardProps) {
  return (
    <details className="collapsible-board hr-enter" id={id} open={defaultOpen || undefined}>
      <summary className="collapsible-board-summary">
        <span className="collapsible-board-title">{title}</span>
        <span className="collapsible-board-meta">
          <span className="mono collapsible-board-count">{count}</span>
          <span className="collapsible-board-hint">{hint}</span>
        </span>
      </summary>
      <div className="collapsible-board-body">{children}</div>
    </details>
  );
}
