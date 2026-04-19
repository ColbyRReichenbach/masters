import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PlayerTournamentStats } from "../../lib/data";
import {
  PLAYER_METRICS,
  formatMetricValue,
  metricUnitLabel,
  type PlayerMetricKey,
} from "../../lib/chart-formatters";
import { BenchmarkToggle } from "../ui/BenchmarkToggle";
import { CohortToggle } from "../ui/CohortToggle";
import { PlayerSearchSelect } from "../ui/PlayerSearchSelect";
import { SectionHeader } from "../ui/SectionHeader";
import { ViewportAwareTooltip } from "../ui/ViewportAwareTooltip";

interface MetricDistributionChartProps {
  metric: PlayerMetricKey;
  cohort: "all" | "top10";
  bins: Array<{
    binStart: number;
    binEnd: number;
    count: number;
    players: PlayerTournamentStats[];
  }>;
  roryValue: number | null;
  fieldAverage: number | null;
  top10Average: number | null;
  selectedPlayerValue: number | null;
  selectedPlayerSlug: string | null;
  players: PlayerTournamentStats[];
  onMetricChange: (metric: PlayerMetricKey) => void;
  onCohortChange: (cohort: "all" | "top10") => void;
  onSelectPlayer: (playerSlug: string) => void;
  onSelectBin: (players: PlayerTournamentStats[], label: string, metric: PlayerMetricKey) => void;
}

const distributionMetrics: PlayerMetricKey[] = [
  "girPct",
  "puttsPerGir",
  "drivingDistanceAvgYards",
  "drivingAccuracyPct",
  "birdies",
  "bogeys",
  "scoreToPar",
];

export function MetricDistributionChart({
  metric,
  cohort,
  bins,
  roryValue,
  fieldAverage,
  top10Average,
  selectedPlayerValue,
  selectedPlayerSlug,
  players,
  onMetricChange,
  onCohortChange,
  onSelectPlayer,
  onSelectBin,
}: MetricDistributionChartProps) {
  const config = PLAYER_METRICS[metric];
  const maxCount = Math.max(...bins.map((bin) => bin.count), 1);
  const chartData = bins.map((bin) => ({
    ...bin,
    binMid: Number(((bin.binStart + bin.binEnd) / 2).toFixed(3)),
  }));
  const minX = bins[0]?.binStart ?? 0;
  const maxX = bins.at(-1)?.binEnd ?? 1;
  const selectBin = (bin: { binStart: number; binEnd: number; players?: PlayerTournamentStats[] }) => {
    if (!bin.players?.length) return;
    onSelectBin(
      bin.players,
      `${formatMetricValue(bin.binStart, metric)} to ${formatMetricValue(bin.binEnd, metric)}`,
      metric
    );
  };

  return (
    <section className="bg-white rounded-2xl sm:rounded-[32px] md:rounded-[48px] p-4 sm:p-6 md:p-14 border border-masters-green/10">
      <SectionHeader
        eyebrow="Field Distribution"
        title="Metric Distribution"
        subtitle={`Histogram of ${config.label.toLowerCase()} across the selected cohort. Vertical markers anchor Rory, the field average, top-10 plus ties, and the selected comparison player.`}
        actions={
          <div className="flex min-w-0 flex-wrap items-end gap-3">
            <BenchmarkToggle
              value={metric}
              onChange={onMetricChange}
              options={distributionMetrics.map((item) => ({ value: item, label: PLAYER_METRICS[item].shortLabel }))}
            />
            <CohortToggle value={cohort} onChange={onCohortChange} />
          </div>
        }
      />

      <div className="w-full overflow-x-auto pb-2">
        <div className="h-[320px] md:h-[360px] min-w-[560px] md:min-w-0">
          <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            onClick={(state) => {
              const bin = (state as {
                activePayload?: Array<{
                  payload?: {
                    binStart: number;
                    binEnd: number;
                    players?: PlayerTournamentStats[];
                  };
                }>;
              })?.activePayload?.[0]?.payload;
              if (bin) selectBin(bin);
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00462118" />
            <XAxis
              type="number"
              domain={[minX, maxX]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#00462170", fontWeight: "bold" }}
              dataKey="binMid"
              tickFormatter={(value) => formatMetricValue(Number(value), metric, true)}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#00462170", fontWeight: "bold" }} />
            {roryValue !== null && <ReferenceLine x={roryValue} stroke="#004621" strokeWidth={3} />}
            {fieldAverage !== null && <ReferenceLine x={fieldAverage} stroke="#8A7246" strokeDasharray="5 5" />}
            {top10Average !== null && <ReferenceLine x={top10Average} stroke="#ffcc00" strokeDasharray="5 5" />}
            {selectedPlayerValue !== null && <ReferenceLine x={selectedPlayerValue} stroke="#b91c1c" strokeWidth={2} />}
            <Tooltip
              offset={32}
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{ pointerEvents: "none", zIndex: 9999 }}
              cursor={{ fill: "rgba(0,70,33,0.05)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const bin = payload[0].payload;
                return (
                  <ViewportAwareTooltip className="bg-masters-green p-4 rounded-2xl shadow-premium border border-white/10 min-w-72">
                    <span className="text-[10px] font-black uppercase tracking-widest text-masters-yellow mb-2 block">
                      {formatMetricValue(bin.binStart, metric)} to {formatMetricValue(bin.binEnd, metric)} {metricUnitLabel(metric)}
                    </span>
                    <div className="flex justify-between border-b border-white/10 pb-3 mb-3">
                      <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Players</span>
                      <span className="text-white font-serif font-black">{bin.count}</span>
                    </div>
                    <div className="space-y-1 pr-1">
                      {bin.players.slice(0, 5).map((player: PlayerTournamentStats) => (
                        <div
                          key={player.playerSlug}
                          className="w-full flex justify-between gap-4 text-left text-[11px] text-white/70"
                        >
                          <span>{player.playerName}</span>
                          <span>{formatMetricValue(player[metric], metric)}</span>
                        </div>
                      ))}
                      {bin.players.length > 5 && (
                        <div className="text-[11px] font-black uppercase tracking-widest text-masters-yellow">
                          Click bar to see all {bin.players.length}
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-white/50 italic mt-3 border-t border-white/10 pt-3">
                      Markers compare Rory to field, top-10 plus ties, and selected player.
                    </p>
                  </ViewportAwareTooltip>
                );
              }}
            />
            <Bar
              dataKey="count"
              radius={[8, 8, 0, 0]}
              maxBarSize={52}
              onClick={(entry) => {
                const bin = entry as unknown as {
                  binStart: number;
                  binEnd: number;
                  players?: PlayerTournamentStats[];
                };
                selectBin(bin);
              }}
            >
              {bins.map((bin) => (
                <Cell
                  key={`${bin.binStart}-${bin.binEnd}`}
                  fill="#004621"
                  fillOpacity={0.25 + (bin.count / maxCount) * 0.65}
                  cursor="pointer"
                  onClick={() => {
                    selectBin(bin);
                  }}
                />
              ))}
            </Bar>
          </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 md:mt-8 flex flex-wrap items-end gap-4 md:gap-6">
        <PlayerSearchSelect players={players} value={selectedPlayerSlug} onChange={onSelectPlayer} />
        {[
          ["Rory", roryValue, "bg-masters-green"],
          ["Field", fieldAverage, "bg-augusta-gold"],
          ["Top 10", top10Average, "bg-masters-yellow"],
          ["Selected", selectedPlayerValue, "bg-under-par"],
        ].map(([label, value, color]) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-ink-400">
              {label}: {typeof value === "number" ? formatMetricValue(value, metric) : "N/A"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
