"use client";

interface SparkBlockProps {
  label: string;
  value: number;
  unit: string;
  color: string;
  data: number[];
  axisLabels?: string[];
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length === 0) return null;
  const w = 240;
  const h = 44;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - ((v - min) / range) * (h - 8) - 4] as [number, number]);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1];
  const gradId = `grad-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="block w-full h-11">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={path} stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="2.4" fill={color} />
      <circle cx={last[0]} cy={last[1]} r="5" fill={color} opacity="0.18" />
    </svg>
  );
}

export function SparkBlock({ label, value, unit, color, data, axisLabels }: SparkBlockProps) {
  return (
    <div className="bg-surface-1 border border-hairline rounded p-3 flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span className="text-[9.5px] tracking-[0.12em] uppercase text-foreground-dim font-semibold flex-1">{label}</span>
        <span className="font-mono text-[15px] font-medium tracking-[-0.01em]" style={{ color }}>
          {Math.round(value)}
          <span className="text-[10px] text-foreground-muted ml-0.5">{unit}</span>
        </span>
      </div>
      <Sparkline data={data} color={color} />
      {axisLabels && (
        <div className="flex justify-between font-mono text-[9px] text-foreground-dim tracking-[0.04em]">
          {axisLabels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}
    </div>
  );
}
