import { formatSigned } from "../../lib/chart-formatters";
import type { RepeatHoleDeltaCell } from "../../lib/selectors";
import { cn } from "../../lib/utils";
import { BenchmarkToggle } from "../ui/BenchmarkToggle";
import { SectionHeader } from "../ui/SectionHeader";

type SegmentFilter = "all" | "front9" | "back9" | "par3" | "par4" | "par5";

interface HoleDeltaMatrixProps {
  cells: RepeatHoleDeltaCell[];
  visibleCells: RepeatHoleDeltaCell[];
  segment: SegmentFilter;
  selectedCell: { roundNumber: 1 | 2 | 3 | 4; holeNumber: number } | null;
  onSegmentChange: (segment: SegmentFilter) => void;
  onSelectCell: (cell: { roundNumber: 1 | 2 | 3 | 4; holeNumber: number }) => void;
}

const segmentOptions: Array<{ value: SegmentFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "front9", label: "Front" },
  { value: "back9", label: "Back" },
  { value: "par3", label: "Par 3" },
  { value: "par4", label: "Par 4" },
  { value: "par5", label: "Par 5" },
];

function cellTone(delta: number) {
  if (delta < 0) return "bg-masters-green text-white border-masters-green";
  if (delta > 0) return "bg-under-par text-white border-under-par";
  return "bg-bg-cream-dark text-masters-green border-masters-green/10";
}

export function HoleDeltaMatrix({
  cells,
  visibleCells,
  segment,
  selectedCell,
  onSegmentChange,
  onSelectCell,
}: HoleDeltaMatrixProps) {
  const visibleKeys = new Set(visibleCells.map((cell) => `${cell.roundNumber}-${cell.holeNumber}`));
  const byHole = Array.from({ length: 18 }, (_, index) => index + 1).map((holeNumber) => ({
    holeNumber,
    cells: [1, 2, 3, 4].map(
      (roundNumber) =>
        cells.find((cell) => cell.roundNumber === roundNumber && cell.holeNumber === holeNumber) ?? null
    ),
  }));

  return (
    <section className="bg-white rounded-[48px] p-10 md:p-14 border border-masters-green/10">
      <SectionHeader
        eyebrow="Hole Delta Matrix"
        title="2026 Minus 2025"
        subtitle="Every cell compares Rory’s score on the same round and hole. Green means better in 2026, red means worse, gray means equal."
        actions={<BenchmarkToggle value={segment} onChange={onSegmentChange} options={segmentOptions} />}
      />

      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-[120px_repeat(4,1fr)] gap-2 mb-3">
            <div />
            {[1, 2, 3, 4].map((round) => (
              <div key={round} className="text-center text-[10px] font-black uppercase tracking-[0.25em] text-masters-green/40">
                Round {round}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {byHole.map((row) => (
              <div key={row.holeNumber} className="grid grid-cols-[120px_repeat(4,1fr)] gap-2 items-center">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-ink-400">
                  Hole {row.holeNumber}
                </div>
                {row.cells.map((cell, index) => {
                  if (!cell) {
                    return <div key={index} className="h-12 rounded-2xl bg-masters-green/5" />;
                  }
                  const key = `${cell.roundNumber}-${cell.holeNumber}`;
                  const isVisible = visibleKeys.has(key);
                  const isSelected =
                    selectedCell?.roundNumber === cell.roundNumber && selectedCell.holeNumber === cell.holeNumber;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!isVisible}
                      title={`Hole ${cell.holeNumber}, Round ${cell.roundNumber}: 2025 ${cell.score2025}, 2026 ${cell.score2026}, delta ${formatSigned(cell.delta)}`}
                      onClick={() => onSelectCell(cell)}
                      className={cn(
                        "h-12 rounded-2xl border text-sm font-black transition-all",
                        cellTone(cell.delta),
                        !isVisible && "opacity-15 grayscale cursor-not-allowed",
                        isVisible && "hover:scale-[1.03]",
                        isSelected && "ring-4 ring-masters-yellow/70"
                      )}
                    >
                      {formatSigned(cell.delta, 0)}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

