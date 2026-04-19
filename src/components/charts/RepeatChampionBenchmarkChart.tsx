import { formatSigned, formatToPar } from "../../lib/chart-formatters";
import type { getRepeatChampionChartRows } from "../../lib/selectors";
import { cn } from "../../lib/utils";
import { SectionHeader } from "../ui/SectionHeader";

type ChampionRow = ReturnType<typeof getRepeatChampionChartRows>[number];

interface RepeatChampionBenchmarkChartProps {
  rows: ChampionRow[];
  selectedChampionKey: string | null;
  onSelectChampion: (championKey: string) => void;
}

function scoreX(value: number) {
  const min = -18;
  const max = 2;
  return Math.max(3, Math.min(97, ((value - min) / (max - min)) * 100));
}

export function RepeatChampionBenchmarkChart({
  rows,
  selectedChampionKey,
  onSelectChampion,
}: RepeatChampionBenchmarkChartProps) {
  return (
    <section className="bg-white rounded-2xl sm:rounded-[32px] md:rounded-[48px] p-4 sm:p-6 md:p-14 border border-masters-green/10">
      <SectionHeader
        eyebrow="Historical Benchmarks"
        title="The Defender Ladder"
        subtitle="All four successful Masters title defenses, shown by first-win score and repeat-year score. Summary-only rows remain useful even without historical hole-by-hole scorecards."
      />

      <div className="space-y-4 md:space-y-5">
        {rows.map((row) => {
          const firstX = scoreX(row.firstWin.scoreToPar);
          const repeatX = scoreX(row.repeatWin.scoreToPar);
          const isSelected = selectedChampionKey === row.championKey;
          const isRory = row.playerSlug === "rory-mcilroy";
          return (
            <button
              key={row.championKey}
              type="button"
              onClick={() => onSelectChampion(row.championKey)}
              title={`${row.playerName}: repeat year ${row.repeatYear}, ${formatToPar(row.repeatWin.scoreToPar)}, margin ${row.repeatWin.winningMargin}, best round ${row.bestRound}, worst round ${row.worstRound}`}
              className={cn(
                "w-full rounded-2xl md:rounded-[32px] border p-4 md:p-6 text-left transition-all",
                isSelected ? "border-masters-green bg-masters-green text-white shadow-premium" : "border-masters-green/10 bg-bg-cream-dark/50 hover:bg-white",
                isRory && !isSelected && "border-masters-green/30"
              )}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[190px_1fr_180px] gap-6 items-center">
                <div>
                  <span className={cn("text-[10px] font-black uppercase tracking-[0.25em] block mb-2", isSelected ? "text-masters-yellow" : "text-masters-green/40")}>
                    {row.displayLabel}
                  </span>
                  <h3 className={cn("font-serif text-2xl font-black", isSelected ? "!text-white" : "text-masters-green")}>
                    {row.playerName}
                  </h3>
                </div>
                <div className="relative h-12">
                  <div className={cn("absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 rounded-full", isSelected ? "bg-white/15" : "bg-masters-green/10")} />
                  <div
                    className={cn("absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full", isSelected ? "bg-masters-yellow/35" : "bg-masters-green/20")}
                    style={{
                      left: `${Math.min(firstX, repeatX)}%`,
                      width: `${Math.abs(firstX - repeatX)}%`,
                    }}
                  />
                  <div
                    className={cn("absolute top-1/2 w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2", isSelected ? "bg-white border-masters-yellow" : "bg-augusta-gold border-white")}
                    style={{ left: `${firstX}%` }}
                  />
                  <div
                    className={cn("absolute top-1/2 w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2", isSelected ? "bg-masters-yellow border-white" : "bg-masters-green border-white")}
                    style={{ left: `${repeatX}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-left lg:text-right">
                  <div>
                    <span className={cn("text-[9px] font-black uppercase tracking-widest block", isSelected ? "text-white/45" : "text-ink-400")}>
                      {row.firstYear}
                    </span>
                    <span className={cn("font-serif text-2xl font-black", isSelected ? "text-white" : "text-masters-green")}>
                      {formatToPar(row.firstWin.scoreToPar)}
                    </span>
                  </div>
                  <div>
                    <span className={cn("text-[9px] font-black uppercase tracking-widest block", isSelected ? "text-white/45" : "text-ink-400")}>
                      {row.repeatYear}
                    </span>
                    <span className={cn("font-serif text-2xl font-black", isSelected ? "text-masters-yellow" : "text-masters-green")}>
                      {formatToPar(row.repeatWin.scoreToPar)}
                    </span>
                  </div>
                </div>
              </div>
              {isSelected && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/10 pt-6">
                  {[
                    ["Margin", row.repeatWin.winningMargin],
                    ["Best Round", row.bestRound],
                    ["Worst Round", row.worstRound],
                    ["Repeat Delta", formatSigned(row.repeatDelta, 0)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">{label}</span>
                      <span className="font-serif text-xl font-black text-masters-yellow">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-augusta-gold" />
          <span className="text-[10px] font-black uppercase tracking-widest text-ink-400">First Win</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-masters-green" />
          <span className="text-[10px] font-black uppercase tracking-widest text-ink-400">Repeat Win</span>
        </div>
      </div>
    </section>
  );
}
