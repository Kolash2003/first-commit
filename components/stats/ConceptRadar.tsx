'use client';

export function ConceptRadar({
  data,
}: {
  data: Array<{ concept: string; selfSolveRate: number }>;
}) {
  if (!data || data.length < 3) return null;
  const items = data.slice(0, 8);
  const n = items.length;
  const cx = 130;
  const cy = 130;
  const r = 100;

  const points = items.map((_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { ax: cx + Math.cos(angle) * r, ay: cy + Math.sin(angle) * r };
  });

  const valuePoints = items.map((d, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const rv = (d.selfSolveRate / 100) * r;
    return `${cx + Math.cos(angle) * rv},${cy + Math.sin(angle) * rv}`;
  });

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg width={260} height={260} className="overflow-visible">
      {gridLevels.map((level) => {
        const gps = points
          .map(({ ax, ay }) => `${cx + (ax - cx) * level},${cy + (ay - cy) * level}`)
          .join(' ');
        return (
          <polygon key={level} points={gps} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        );
      })}

      {points.map(({ ax, ay }, i) => (
        <line key={i} x1={cx} y1={cy} x2={ax} y2={ay} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      ))}

      <polygon
        points={valuePoints.join(' ')}
        fill="rgba(16,185,129,0.2)"
        stroke="rgba(16,185,129,0.7)"
        strokeWidth={1.5}
      />

      {items.map((d, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        const rv = (d.selfSolveRate / 100) * r;
        return (
          <circle
            key={i}
            cx={cx + Math.cos(angle) * rv}
            cy={cy + Math.sin(angle) * rv}
            r={3}
            fill="#10b981"
          />
        );
      })}

      {items.map((d, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        const labelR = r + 18;
        const lx = cx + Math.cos(angle) * labelR;
        const ly = cy + Math.sin(angle) * labelR;
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fill="rgba(148,163,184,0.9)"
            fontFamily="monospace"
          >
            {d.concept.length > 10 ? d.concept.slice(0, 10) + '…' : d.concept}
          </text>
        );
      })}
    </svg>
  );
}
