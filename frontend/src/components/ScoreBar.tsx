export default function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="w-full">
      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-2 rounded-full bg-black"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-gray-600 mt-1">{value} / {max}</div>
    </div>
  );
}