import { type MouseEvent, useMemo, useState } from "react";
import { formatSigned } from "../../lib/chart-formatters";
import type { RepeatHoleDeltaCell } from "../../lib/selectors";
import { cn } from "../../lib/utils";
import { SectionHeader } from "../ui/SectionHeader";
import { ViewportAwareTooltip } from "../ui/ViewportAwareTooltip";

interface RoundSwingStoryChartProps {
  cells: RepeatHoleDeltaCell[];
  selectedCell: { roundNumber: 1 | 2 | 3 | 4; holeNumber: number } | null;
  onSelectCell: (cell: { roundNumber: 1 | 2 | 3 | 4; holeNumber: number }) => void;
}

interface TooltipState {
  cell: RepeatHoleDeltaCell;
  x: number;
  y: number;
}

function deltaTone(delta: number) {
  if (delta < 0) return "bg-masters-green text-white border-masters-green";
  if (delta > 0) return "bg-under-par text-white border-under-par";
  return "bg-bg-cream-dark text-masters-green border-masters-green/10";
}

function deltaTextTone(delta: number) {
  if (delta < 0) return "text-masters-green";
  if (delta > 0) return "text-under-par";
  return "text-ink-400";
}

function roundVerdict(delta: number) {
  if (delta < 0) return `2026 gained ${Math.abs(delta)} ${Math.abs(delta) === 1 ? "shot" : "shots"}`;
  if (delta > 0) return `2026 gave back ${delta} ${delta === 1 ? "shot" : "shots"}`;
  return "The round played even";
}

function formatHoleSwing(cell: RepeatHoleDeltaCell | undefined, fallback: string) {
  if (!cell) return fallback;
  const isLong = cell.holeName.length > 15;
  return (
    <span className="flex items-start justify-between w-full min-w-0">
      <span className="flex flex-col min-w-0">
        <span className={cn(
          "font-serif font-black leading-[1.1] break-words",
          isLong ? "text-[17px]" : "text-xl"
        )}>
          {cell.holeName}
          <span className="text-[10px] font-sans font-bold opacity-30 ml-1.5 inline-block align-middle transform -translate-y-[1px]">#{cell.holeNumber}</span>
        </span>
      </span>
      <span className="shrink-0 tabular-nums ml-2">{formatSigned(cell.delta, 0)}</span>
    </span>
  );
}

export function RoundSwingStoryChart({
  cells,
  selectedCell,
  onSelectCell,
}: RoundSwingStoryChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const rounds = useMemo(
    () =>
      ([1, 2, 3, 4] as const).map((roundNumber) => {
        const roundCells = cells
          .filter((cell) => cell.roundNumber === roundNumber)
          .sort((a, b) => a.holeNumber - b.holeNumber);
        const netDelta = roundCells.reduce((sum, cell) => sum + cell.delta, 0);
        const score2025 = roundCells.reduce((sum, cell) => sum + cell.score2025, 0);
        const score2026 = roundCells.reduce((sum, cell) => sum + cell.score2026, 0);
        const bestSwing = [...roundCells].sort((a, b) => a.delta - b.delta)[0];
        const worstSwing = [...roundCells].sort((a, b) => b.delta - a.delta)[0];
        const changedHoles = roundCells.filter((cell) => cell.delta !== 0).length;

        return {
          roundNumber,
          cells: roundCells,
          netDelta,
          score2025,
          score2026,
          bestSwing,
          worstSwing,
          changedHoles,
        };
      }),
    [cells]
  );

  const moveTooltip = (event: MouseEvent, cell: RepeatHoleDeltaCell) => {
    setTooltip({
      cell,
      x: event.clientX + 20,
      y: event.clientY + 20,
    });
  };

  return (
    <section className="bg-white rounded-[48px] p-10 md:p-14 border border-masters-green/10">
      <SectionHeader
        eyebrow="Round Swing Story"
        title="How the Defense Differed"
        subtitle="Each round is compressed into its net score swing versus 2025, with a tiny hole strip showing where 2026 gained, gave back, or matched the first title run."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {rounds.map((round) => (
          <article
            key={round.roundNumber}
            className={cn(
              "rounded-[32px] border p-7 transition-colors",
              round.netDelta < 0 && "bg-masters-green/5 border-masters-green/20",
              round.netDelta > 0 && "bg-under-par/5 border-under-par/20",
              round.netDelta === 0 && "bg-bg-cream-dark/60 border-masters-green/10"
            )}
          >
            <div className="flex items-start justify-between gap-5 mb-7">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.28em] text-masters-green/40 block mb-2">
                  Round {round.roundNumber}
                </span>
                <h3 className="font-serif text-3xl font-black text-masters-green">
                  {roundVerdict(round.netDelta)}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black uppercase tracking-[0.24em] text-ink-400 block mb-1">
                  Net Swing
                </span>
                <span className={cn("font-serif text-5xl font-black leading-none", deltaTextTone(round.netDelta))}>
                  {formatSigned(round.netDelta, 0)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-7">
              {[
                ["2025", round.score2025],
                ["2026", round.score2026],
                ["Changed", round.changedHoles],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-masters-green/10 bg-white/75 p-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-ink-400 block mb-1">
                    {label}
                  </span>
                  <span className="font-serif text-2xl font-black text-masters-green">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-7">
              <div className="rounded-2xl border border-masters-green/10 bg-white/75 p-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-ink-400 block mb-1">
                  Best Swing
                </span>
                <span className="font-serif text-xl font-black text-masters-green flex w-full">
                  {formatHoleSwing(round.bestSwing, "Even")}
                </span>
              </div>
              <div className="rounded-2xl border border-masters-green/10 bg-white/75 p-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-ink-400 block mb-1">
                  Worst Swing
                </span>
                <span className={cn("font-serif text-xl font-black flex w-full", deltaTextTone(round.worstSwing?.delta ?? 0))}>
                  {formatHoleSwing(round.worstSwing, "Even")}
                </span>
              </div>
            </div>

            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))" }}
              onMouseLeave={() => setTooltip(null)}
            >
              {round.cells.map((cell) => {
                const isSelected =
                  selectedCell?.roundNumber === cell.roundNumber &&
                  selectedCell.holeNumber === cell.holeNumber;
                return (
                  <button
                    key={`${cell.roundNumber}-${cell.holeNumber}`}
                    type="button"
                    title={`Round ${cell.roundNumber}, Hole ${cell.holeNumber}: 2025 ${cell.score2025}, 2026 ${cell.score2026}, delta ${formatSigned(cell.delta, 0)}`}
                    onMouseEnter={(event) => moveTooltip(event, cell)}
                    onMouseMove={(event) => moveTooltip(event, cell)}
                    onFocus={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect();
                      setTooltip({ cell, x: rect.left + rect.width / 2, y: rect.bottom + 16 });
                    }}
                    onBlur={() => setTooltip(null)}
                    onClick={() => onSelectCell(cell)}
                    className={cn(
                      "h-12 rounded-xl border text-[9px] font-black transition-all hover:-translate-y-0.5",
                      deltaTone(cell.delta),
                      isSelected && "ring-4 ring-masters-yellow/70"
                    )}
                    aria-label={`Select round ${cell.roundNumber} hole ${cell.holeNumber}`}
                  >
                    {cell.holeNumber}
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-5">
        {[
          ["Better in 2026", "bg-masters-green"],
          ["Worse in 2026", "bg-under-par"],
          ["Same score", "bg-bg-cream-dark border border-masters-green/10"],
        ].map(([label, color]) => (
          <div key={label} className="flex items-center gap-2">
            <span className={cn("w-3 h-3 rounded-full", color)} />
            <span className="text-[10px] font-black uppercase tracking-widest text-ink-400">
              {label}
            </span>
          </div>
        ))}
      </div>

      {tooltip && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <ViewportAwareTooltip className="bg-masters-green p-4 rounded-2xl shadow-premium border border-white/10 min-w-64">
            <span className="text-[10px] font-black uppercase tracking-widest text-masters-yellow mb-2 block">
              Round {tooltip.cell.roundNumber} · Hole {tooltip.cell.holeNumber}
            </span>
            <h4 className="font-serif text-xl font-black !text-white mb-3">
              {tooltip.cell.holeName}
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between gap-8">
                <span className="text-white/55 text-[10px] font-bold uppercase tracking-widest">2025</span>
                <span className="text-white font-serif font-black">{tooltip.cell.score2025}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-masters-yellow text-[10px] font-bold uppercase tracking-widest">2026</span>
                <span className="text-masters-yellow font-serif font-black">{tooltip.cell.score2026}</span>
              </div>
              <div className="flex justify-between gap-8 border-t border-white/10 pt-2">
                <span className="text-white/45 text-[10px] font-bold uppercase tracking-widest">Delta</span>
                <span className="text-white/75 font-serif font-black">{formatSigned(tooltip.cell.delta, 0)}</span>
              </div>
            </div>
            <p className="text-[11px] text-white/50 italic mt-3 border-t border-white/10 pt-3">
              Negative delta means 2026 was better on that round and hole.
            </p>
          </ViewportAwareTooltip>
        </div>
      )}
    </section>
  );
}
