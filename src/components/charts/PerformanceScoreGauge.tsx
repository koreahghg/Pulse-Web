'use client';

import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

interface Props {
  score: number; // 0–100
}

const BANDS = [
  { min: 90, label: '좋음', color: '#10b981' },
  { min: 50, label: '개선 필요', color: '#f59e0b' },
  { min: 0, label: '나쁨', color: '#ef4444' },
] as const;

function getBand(score: number) {
  return BANDS.find((b) => score >= b.min) ?? BANDS[BANDS.length - 1];
}

export function PerformanceScoreGauge({ score }: Props) {
  const band = getBand(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-[160px] w-[160px]">
        <RadialBarChart
          width={160}
          height={160}
          cx={80}
          cy={80}
          innerRadius={55}
          outerRadius={72}
          startAngle={90}
          endAngle={-270}
          data={[{ value: score }]}
          barSize={17}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: '#e2e8f0' }}
            dataKey="value"
            angleAxisId={0}
            cornerRadius={8}
            fill={band.color}
          />
        </RadialBarChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold leading-none" style={{ color: band.color }}>
            {score}
          </span>
          <span className="mt-0.5 text-xs text-slate-400">/ 100</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Performance</p>
        <span
          className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ backgroundColor: `${band.color}1a`, color: band.color }}
        >
          {band.label}
        </span>
      </div>
    </div>
  );
}
