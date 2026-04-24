'use client';

interface BarData {
  label: string;
  value: number;
  max: number;
  color?: string;
}

export function BarChart({ data }: { data: BarData[] }) {
  if (data.length === 0) return <p className="text-zinc-600 text-sm">데이터 없음</p>;
  return (
    <div className="flex flex-col gap-2">
      {data.map(({ label, value, max, color = 'bg-blue-500' }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-20 text-xs text-zinc-400 text-right truncate">{label}</span>
          <div className="flex-1 h-4 bg-zinc-800 rounded overflow-hidden">
            <div
              className={`h-full rounded ${color}`}
              style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
            />
          </div>
          <span className="w-6 text-xs text-zinc-300 text-right">{value}</span>
        </div>
      ))}
    </div>
  );
}
