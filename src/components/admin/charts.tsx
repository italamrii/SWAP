/** Minimal, accessible SVG charts (single accent hue, direct labels). */

export function BarList({ data, valueLabel = "" }: { data: { label: string; value: number }[]; valueLabel?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-2.5" role="list">
      {data.map((d) => (
        <li key={d.label} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3 text-sm">
          <span className="truncate text-muted-foreground">{d.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-surface-2" role="meter" aria-valuenow={d.value} aria-valuemax={max} aria-label={d.label}>
            <span className="block h-full rounded-full bg-primary" style={{ width: `${(d.value / max) * 100}%` }} />
          </span>
          <span className="text-end font-semibold num">{d.value}{valueLabel}</span>
        </li>
      ))}
    </ul>
  );
}

export function AreaChart({ data, height = 160, label }: { data: { x: string; y: number }[]; height?: number; label: string }) {
  if (data.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">لا توجد بيانات بعد</p>;
  const W = 600;
  const max = Math.max(1, ...data.map((d) => d.y));
  const step = data.length > 1 ? W / (data.length - 1) : W;
  // RTL: newest on the left, so reverse the x axis.
  const pts = data.map((d, i) => [W - i * step, height - 8 - (d.y / max) * (height - 28)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]},${height} L${pts[0][0]},${height} Z`;
  const total = data.reduce((a, d) => a + d.y, 0);
  const last = data[data.length - 1];
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${height}`} className="h-40 w-full" role="img" aria-label={`${label}: المجموع ${total}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--primary)" stopOpacity="0.25" /><stop offset="1" stopColor="var(--primary)" stopOpacity="0" /></linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={W} y1={height * f} y2={height * f} stroke="var(--border)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />)}
        <path d={area} fill="url(#area-fill)" />
        <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{data[0]?.x}</span>
        <span>آخر يوم: <b className="text-foreground num">{last.y}</b> · المجموع: <b className="text-foreground num">{total.toLocaleString("en-US")}</b></span>
        <span>{last.x}</span>
      </figcaption>
    </figure>
  );
}
