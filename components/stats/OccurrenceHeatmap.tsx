'use client';

export function OccurrenceHeatmap({ data }: { data: Array<{ date: string; count: number }> }) {
  const weeks = 13;
  const days = 7;
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - weeks * 7 + 1);

  const countMap = new Map<string, number>();
  data.forEach((d) => countMap.set(d.date, d.count));

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const cells: Array<{ date: string; count: number; col: number; row: number }> = [];
  for (let i = 0; i < weeks * days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const count = countMap.get(dateStr) || 0;
    cells.push({ date: dateStr, count, col: Math.floor(i / days), row: i % days });
  }

  const getColor = (count: number) => {
    if (count === 0) return 'rgba(255,255,255,0.05)';
    const intensity = count / maxCount;
    if (intensity < 0.33) return 'rgba(244,63,94,0.35)';
    if (intensity < 0.66) return 'rgba(244,63,94,0.6)';
    return 'rgba(244,63,94,0.9)';
  };

  const cellSize = 13;
  const gap = 2;

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-end gap-1 mb-1">
        {['Mon', 'Wed', 'Fri'].map((d) => (
          <span
            key={d}
            className="text-[9px] text-slate-500 font-mono"
            style={{ width: (cellSize + gap) * 2 }}
          >
            {d}
          </span>
        ))}
      </div>
      <svg width={(cellSize + gap) * weeks} height={(cellSize + gap) * days} className="overflow-visible">
        {cells.map((cell, i) => (
          <g key={i}>
            <rect
              x={cell.col * (cellSize + gap)}
              y={cell.row * (cellSize + gap)}
              width={cellSize}
              height={cellSize}
              rx={2}
              fill={getColor(cell.count)}
              className="transition-all duration-150"
            />
            <title>
              {cell.date}: {cell.count} occurrence{cell.count !== 1 ? 's' : ''}
            </title>
          </g>
        ))}
      </svg>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[9px] text-slate-500">Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <div
            key={v}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getColor(v * maxCount) }}
          />
        ))}
        <span className="text-[9px] text-slate-500">More</span>
      </div>
    </div>
  );
}
