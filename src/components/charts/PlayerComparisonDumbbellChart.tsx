import type { PlayerTournamentStats } from "../../lib/data";
import {
  PLAYER_METRICS,
  formatMetricValue,
  type PlayerMetricKey,
} from "../../lib/chart-formatters";
import { getMetricValue } from "../../lib/selectors";
import { PlayerSearchSelect } from "../ui/PlayerSearchSelect";
import { SectionHeader } from "../ui/SectionHeader";

interface PlayerComparisonDumbbellChartProps {
  rory: PlayerTournamentStats;
  selectedPlayer: PlayerTournamentStats | null;
  fieldAverages: Record<PlayerMetricKey, number | null>;
  top10Averages: Record<PlayerMetricKey, number | null>;
  players: PlayerTournamentStats[];
  selectedPlayerSlug: string | null;
  onSelectPlayer: (playerSlug: string) => void;
  onSelectMetric: (metric: PlayerMetricKey) => void;
}

const rows: PlayerMetricKey[] = [
  "drivingDistanceAvgYards",
  "drivingAccuracyPct",
  "girPct",
  "puttsPerGir",
  "birdies",
  "bogeys",
  "doubles",
  "scoreToPar",
];

function scaleValue(value: number, min: number, max: number) {
  if (max === min) return 50;
  return Math.max(4, Math.min(96, ((value - min) / (max - min)) * 100));
}

export function PlayerComparisonDumbbellChart({
  rory,
  selectedPlayer,
  fieldAverages,
  top10Averages,
  players,
  selectedPlayerSlug,
  onSelectPlayer,
  onSelectMetric,
}: PlayerComparisonDumbbellChartProps) {
  return (
    <section className="bg-white rounded-2xl sm:rounded-[32px] md:rounded-[48px] p-4 sm:p-6 md:p-14 border border-masters-green/10">
      <SectionHeader
        eyebrow="Player Matchup"
        title="Rory vs Selected Player"
        subtitle="Each row places Rory, the selected player, the field average, and the top-10 plus ties on the same metric scale. Click a row to send that metric to the histogram."
        actions={<PlayerSearchSelect players={players} value={selectedPlayerSlug} onChange={onSelectPlayer} compact />}
      />

      <div className="space-y-4 md:space-y-5">
        {rows.map((key) => {
          const config = PLAYER_METRICS[key];
          const roryValue = getMetricValue(rory, key);
          const selectedValue = selectedPlayer ? getMetricValue(selectedPlayer, key) : null;
          const fieldValue = fieldAverages[key];
          const top10Value = top10Averages[key];
          const values = [roryValue, selectedValue, fieldValue, top10Value].filter(
            (value): value is number => value !== null && Number.isFinite(value)
          );
          const min = Math.min(...values);
          const max = Math.max(...values);
          const padding = (max - min || 1) * 0.12;
          const scaleMin = min - padding;
          const scaleMax = max + padding;
          const roryX = roryValue === null ? 0 : scaleValue(roryValue, scaleMin, scaleMax);
          const selectedX = selectedValue === null ? 0 : scaleValue(selectedValue, scaleMin, scaleMax);
          const fieldX = fieldValue === null ? 0 : scaleValue(fieldValue, scaleMin, scaleMax);
          const top10X = top10Value === null ? 0 : scaleValue(top10Value, scaleMin, scaleMax);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectMetric(key)}
              title={`${config.label}: ${config.directionality === "higher_better" ? "higher is better" : "lower is better"}`}
              className="w-full text-left rounded-2xl md:rounded-3xl border border-masters-green/10 bg-bg-cream-dark/60 p-4 md:p-5 hover:bg-white transition-colors group"
            >
              <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_150px] gap-5 items-center">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-masters-green/45 block mb-1">
                    {config.shortLabel}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-ink-400">
                    {config.directionality === "higher_better" ? "Higher is better" : "Lower is better"}
                  </span>
                </div>
                <div className="relative h-12">
                  <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-masters-green/10 rounded-full" />
                  {fieldValue !== null && (
                    <div className="absolute top-2 bottom-2 w-0.5 bg-augusta-gold/60" style={{ left: `${fieldX}%` }} />
                  )}
                  {top10Value !== null && (
                    <div className="absolute top-2 bottom-2 w-0.5 bg-masters-yellow" style={{ left: `${top10X}%` }} />
                  )}
                  {roryValue !== null && selectedValue !== null && (
                    <div
                      className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-masters-green/25"
                      style={{
                        left: `${Math.min(roryX, selectedX)}%`,
                        width: `${Math.abs(roryX - selectedX)}%`,
                      }}
                    />
                  )}
                  {roryValue !== null && (
                    <div
                      className="absolute top-1/2 w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-masters-green border-2 border-white shadow-lg"
                      style={{ left: `${roryX}%` }}
                    />
                  )}
                  {selectedValue !== null && (
                    <div
                      className="absolute top-1/2 w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-under-par border-2 border-white shadow-lg"
                      style={{ left: `${selectedX}%` }}
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-left lg:text-right">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-ink-400 block">Rory</span>
                    <span className="font-serif text-xl font-black text-masters-green">{formatMetricValue(roryValue, key)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-ink-400 block">
                      {selectedPlayer?.playerName.split(" ").at(-1) ?? "Player"}
                    </span>
                    <span className="font-serif text-xl font-black text-under-par">{formatMetricValue(selectedValue, key)}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap gap-6">
        {[
          ["Rory", "bg-masters-green"],
          ["Selected", "bg-under-par"],
          ["Field Avg", "bg-augusta-gold"],
          ["Top 10 + Ties", "bg-masters-yellow"],
        ].map(([label, color]) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-ink-400">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
