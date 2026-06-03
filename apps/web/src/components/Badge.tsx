type BadgeProps = {
  value: string;
};

export function Badge({ value }: BadgeProps) {
  const slug = value.replace(/\s+/g, "_").toLowerCase();
  const label = value.replace(/_/g, " ");
  return <span className={`badge badge--${slug}`}>{label}</span>;
}
