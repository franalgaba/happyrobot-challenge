import { getCategoryDisplay, type CategoryKind } from "../config/display-maps";

type BadgeProps = {
  value: string;
  kind: CategoryKind;
};

export function Badge({ value, kind }: BadgeProps) {
  const { label, color } = getCategoryDisplay(kind, value);

  return (
    <span className="category-label">
      <span className="category-label-swatch" style={{ background: color }} aria-hidden />
      <span className="category-label-text">{label}</span>
    </span>
  );
}
