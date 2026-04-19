import { PLAYER_METRICS, type PlayerMetricKey } from "../../lib/chart-formatters";

const METRIC_OPTIONS = Object.values(PLAYER_METRICS);

interface AxisMetricSelectProps {
  label: string;
  value: PlayerMetricKey;
  onChange: (value: PlayerMetricKey) => void;
  disabledMetric?: PlayerMetricKey;
}

export function AxisMetricSelect({ label, value, onChange, disabledMetric }: AxisMetricSelectProps) {
  return (
    <label className="flex min-w-[180px] flex-1 flex-col gap-2 sm:flex-none">
      <span className="text-[9px] font-black uppercase tracking-[0.24em] text-masters-green/40">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as PlayerMetricKey)}
        className="h-11 w-full rounded-xl border border-masters-green/10 bg-white px-4 text-xs font-bold uppercase tracking-widest text-masters-green outline-none transition focus:border-masters-green/40"
      >
        {METRIC_OPTIONS.map((metric) => (
          <option key={metric.key} value={metric.key} disabled={metric.key === disabledMetric}>
            {metric.shortLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
