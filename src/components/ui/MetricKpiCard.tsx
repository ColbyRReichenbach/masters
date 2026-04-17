import { formatMetricValue, type PlayerMetricKey, type PlayerMetricConfig } from "../../lib/chart-formatters";
import { cn } from "../../lib/utils";

interface MetricKpiCardProps {
  metric: PlayerMetricConfig;
  value: number | null;
  fieldAverage: number | null;
  top10Average: number | null;
  percentile: number | null;
  rank: number | null;
}

export function MetricKpiCard({
  metric,
  value,
  fieldAverage,
  top10Average,
  percentile,
  rank,
}: MetricKpiCardProps) {
  const key = metric.key as PlayerMetricKey;

  return (
    <div className="bg-white rounded-[32px] p-7 border border-masters-green/10 shadow-sm">
      <div className="flex justify-end mb-7">
        <div className="text-right">
          <span className="text-[9px] font-black uppercase tracking-[0.28em] text-masters-green/35 block mb-1">
            Rank
          </span>
          <span className={cn(
            "font-serif text-4xl font-black leading-none",
            rank === 1 ? "text-masters-yellow" : "text-masters-green"
          )}>
            {rank ?? "N/A"}
          </span>
        </div>
      </div>

      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-ink-400 block mb-2">
        {metric.label}
      </span>
      <div className="flex items-end gap-2 mb-6">
        <span className="text-4xl font-serif font-black text-masters-green">
          {formatMetricValue(value, key, true)}
        </span>
        {metric.unit !== "count" && metric.unit !== "toPar" && (
          <span className="text-[10px] font-black uppercase tracking-widest text-ink-400 mb-1">
            {metric.unit}
          </span>
        )}
      </div>

      <div className="space-y-3 border-t border-masters-green/10 pt-5">
        <div className="flex justify-between gap-4 text-[10px] font-black uppercase tracking-widest">
          <span className="text-ink-400">Field Avg</span>
          <span className="text-masters-green">{formatMetricValue(fieldAverage, key)}</span>
        </div>
        <div className="flex justify-between gap-4 text-[10px] font-black uppercase tracking-widest">
          <span className="text-ink-400">Top 10 Avg</span>
          <span className="text-masters-green">{formatMetricValue(top10Average, key)}</span>
        </div>
        <div
          className={cn(
            "flex items-center justify-between gap-4 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest",
            "bg-masters-green text-white"
          )}
        >
          <span className="text-white/65">Percentile</span>
          <span className="text-masters-yellow">{percentile ?? "N/A"}%</span>
        </div>
      </div>
    </div>
  );
}
