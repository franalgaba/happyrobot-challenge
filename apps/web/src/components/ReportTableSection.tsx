import type { ReactNode } from "react";

type ReportTableSectionProps = {
  headingId: string;
  title: string;
  subtitle: string;
  isEmpty: boolean;
  emptyTitle: string;
  emptyBody: string;
  children: ReactNode;
};

export function ReportTableSection({
  headingId,
  title,
  subtitle,
  isEmpty,
  emptyTitle,
  emptyBody,
  children,
}: ReportTableSectionProps) {
  return (
    <section className="report-section hr-enter" aria-labelledby={headingId}>
      <header className="report-section-head">
        <h2 id={headingId}>{title}</h2>
        <p>{subtitle}</p>
      </header>
      <div className={`report-section-body${isEmpty ? " report-section-body--empty" : ""}`}>
        {isEmpty ? (
          <div className="empty-state">
            <strong>{emptyTitle}</strong>
            <p>{emptyBody}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
