'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import type { MetricScore } from '@/types';
import type { WebVitals, WebVitalKey } from '@/types/webVitals';
import { WEB_VITAL_THRESHOLDS } from '@/types/webVitals';

const SCORE_COLORS: Record<MetricScore, string> = {
  good: '#10b981',
  'needs-improvement': '#f59e0b',
  poor: '#ef4444',
};

const METRIC_INFO: Partial<Record<WebVitalKey, { short: string; full: string }>> = {
  lcp: { short: 'LCP', full: 'Largest Contentful Paint' },
  cls: { short: 'CLS', full: 'Cumulative Layout Shift' },
  fcp: { short: 'FCP', full: 'First Contentful Paint' },
  tbt: { short: 'TBT', full: 'Total Blocking Time' },
  si: { short: 'SI', full: 'Speed Index' },
  inp: { short: 'INP', full: 'Interaction to Next Paint' },
  ttfb: { short: 'TTFB', full: 'Time to First Byte' },
};

function formatThreshold(key: WebVitalKey, ms: number): string {
  if (key === 'cls') return String(ms);
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;
}

interface DataPoint {
  key: WebVitalKey;
  name: string;
  fullName: string;
  normalized: number;
  score: MetricScore;
  displayValue: string;
  goodThreshold: string;
  poorThreshold: string;
}

interface Props {
  webVitals: WebVitals;
}

export function WebVitalsBarChart({ webVitals }: Props) {
  const data: DataPoint[] = (Object.keys(WEB_VITAL_THRESHOLDS) as WebVitalKey[])
    .map((key): DataPoint | null => {
      const metric = webVitals[key];
      if (!metric) return null;
      const threshold = WEB_VITAL_THRESHOLDS[key];
      return {
        key,
        name: METRIC_INFO[key]?.short ?? key.toUpperCase(),
        fullName: METRIC_INFO[key]?.full ?? key,
        normalized: Math.min((metric.value / threshold.poor) * 100, 150),
        score: metric.score,
        displayValue: metric.displayValue,
        goodThreshold: formatThreshold(key, threshold.good),
        poorThreshold: formatThreshold(key, threshold.poor),
      };
    })
    .filter((item): item is DataPoint => item !== null);

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={data.length * 54 + 40}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 8, right: 90, left: 0, bottom: 8 }}
        barCategoryGap="35%"
      >
        <XAxis type="number" domain={[0, 150]} hide />
        <YAxis
          type="category"
          dataKey="name"
          width={48}
          tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<MetricTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
        <ReferenceLine
          x={100}
          stroke="#ef4444"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          label={{ value: '나쁨 기준', position: 'insideTopRight', fontSize: 10, fill: '#ef4444', dy: -4 }}
        />
        <Bar dataKey="normalized" radius={[0, 6, 6, 0]} maxBarSize={22}>
          <LabelList
            dataKey="displayValue"
            position="right"
            style={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
          />
          {data.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={SCORE_COLORS[entry.score]} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function MetricTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: DataPoint }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as DataPoint;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-lg">
      <p className="text-sm font-semibold text-slate-800">{item.fullName}</p>
      <p className="mt-1 text-sm text-slate-600">
        실제 값:{' '}
        <span className="font-semibold text-slate-800">{item.displayValue}</span>
      </p>
      <p className="mt-1 text-xs text-slate-500">
        좋음 &lt; {item.goodThreshold} · 나쁨 &gt; {item.poorThreshold}
      </p>
    </div>
  );
}
