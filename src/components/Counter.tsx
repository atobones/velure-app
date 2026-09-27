export default function Counter({ value, total = 9, size = 17, dark = false, color }: { value: number | string; total?: number; size?: number; dark?: boolean; color?: string }) {
  const air = Math.round(size * 0.28);
  return (
    <span className="inline-flex items-baseline font-semibold" style={{ fontSize: size, lineHeight: 1.2, color: color ?? (dark ? "var(--cream)" : "var(--ink)"), fontVariantNumeric: "lining-nums tabular-nums" }}>
      <span>{value}</span>
      <span style={{ fontSize: Math.round(size * 0.7), fontWeight: 400, color: dark ? "rgba(250,242,231,.45)" : "var(--ink-2)", paddingLeft: air, paddingRight: air }}>/</span>
      <span>{total}</span>
    </span>
  );
}
