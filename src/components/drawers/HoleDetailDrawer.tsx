import { AnimatePresence, motion } from "motion/react";
import { BarChart3, X } from "lucide-react";
import type { HoleScore, ScorecardData } from "../../lib/data";
import { formatSigned, formatToPar } from "../../lib/chart-formatters";
import { cn } from "../../lib/utils";

type HoleDrawerFocus = "rory" | "vsField" | "vsTop10";

interface HoleDetailDrawerProps {
  isOpen: boolean;
  roundNumber: 1 | 2 | 3 | 4;
  hole: HoleScore | null;
  holeDifficultyRank: number | null;
  roryTournamentAverage: number | null;
  comparison: { vsField: number; vsTop10: number } | null;
  trajectoryPoint: ScorecardData["trajectory"][number] | null;
  focus: HoleDrawerFocus;
  onFocusChange: (focus: HoleDrawerFocus) => void;
  onClose: () => void;
}

function comparisonTone(value: number) {
  if (value > 0) return "text-masters-green";
  if (value < 0) return "text-under-par";
  return "text-ink-400";
}

function comparisonNarrative(value: number, target: string) {
  if (value > 0) return `Rory scored ${value.toFixed(3)} strokes better than the ${target} on this hole.`;
  if (value < 0) return `Rory scored ${Math.abs(value).toFixed(3)} strokes worse than the ${target} on this hole.`;
  return `Rory matched the ${target} average exactly on this hole.`;
}

function StatLine({
  label,
  helper,
  value,
  tone,
}: {
  label: string;
  helper: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex justify-between items-end border-b border-masters-green/10 pb-6">
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">
          {label}
        </span>
        <span className="text-xs font-medium italic opacity-60 font-sans tracking-tight">
          {helper}
        </span>
      </div>
      <span className={cn("text-3xl font-serif font-black text-masters-green", tone)}>
        {value}
      </span>
    </div>
  );
}

export function HoleDetailDrawer({
  isOpen,
  roundNumber,
  hole,
  holeDifficultyRank,
  roryTournamentAverage,
  comparison,
  trajectoryPoint,
  focus,
  onFocusChange,
  onClose,
}: HoleDetailDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && hole && comparison && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-masters-green/40 backdrop-blur-sm z-[100]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl z-[101] overflow-y-auto"
          >
            <div className="relative h-72 w-full bg-masters-green">
              <img
                src={`/layouts/layout_${hole.holeNumber}.jpg`}
                className="w-full h-full object-cover opacity-45 mix-blend-multiply"
                alt={`Hole ${hole.holeNumber} layout`}
                onError={(event) => {
                  event.currentTarget.src = "/scoreboard.jpg";
                }}
              />
              <button
                type="button"
                onClick={onClose}
                className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-masters-green transition-all z-30 shadow-2xl"
                aria-label="Close hole drawer"
              >
                <X size={20} />
              </button>
              <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start pointer-events-none">
                <div className="bg-masters-green/80 backdrop-blur-md px-4 py-2 rounded-xl text-white font-serif italic font-bold border border-white/10">
                  Round {roundNumber} · Par {hole.par} · {hole.yardage} yds
                </div>
              </div>
              <div className="absolute bottom-10 left-10 right-8">
                <h3 className="font-serif text-5xl font-black text-white italic leading-tight mb-2">
                  {hole.holeName || "Augusta National"}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-masters-yellow">
                    Hole {hole.holeNumber}
                  </span>
                  <span className="w-10 h-0.5 bg-masters-yellow/30" />
                </div>
              </div>
            </div>

            <div className="p-10 space-y-10">
              <div className="grid grid-cols-3 gap-2 bg-masters-green/5 p-2 rounded-2xl border border-masters-green/10">
                {[
                  { value: "rory" as const, label: "Rory" },
                  { value: "vsField" as const, label: "vs Field" },
                  { value: "vsTop10" as const, label: "vs Top 10" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => onFocusChange(item.value)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      focus === item.value
                        ? "bg-masters-green text-white shadow-lg"
                        : "text-masters-green/50 hover:text-masters-green"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {focus === "rory" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6 p-8 bg-masters-green/5 rounded-[32px] border border-masters-green/10">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 font-sans block mb-2">
                        Tournament Difficulty
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-serif font-black text-masters-green">
                          Rank {holeDifficultyRank ?? "N/A"}
                        </span>
                        <span className="text-xs font-bold opacity-40">/18</span>
                      </div>
                    </div>
                    <div className="border-l border-masters-green/10 pl-6">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 font-sans block mb-2">
                        Rory Tournament Avg
                      </span>
                      <div className="text-3xl font-serif font-black text-masters-green">
                        {roryTournamentAverage?.toFixed(2) ?? "N/A"}
                      </div>
                    </div>
                  </div>
                  <StatLine label="Rory Score" helper="Hole result" value={`${hole.score}`} />
                  <StatLine label="Result" helper="Relative to par" value={`${hole.label} (${formatToPar(hole.toPar)})`} />
                  {trajectoryPoint && (
                    <div className="flex justify-between items-center p-6 bg-masters-green rounded-3xl text-white">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block mb-1">
                          Cumulative Position
                        </span>
                        <span className="text-xs font-medium italic opacity-80">After this hole</span>
                      </div>
                      <span className="text-2xl font-serif font-black">
                        {formatToPar(trajectoryPoint.cumulativeToPar, 1)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {focus === "vsField" && (
                <div className="space-y-6">
                  <div className="p-8 bg-augusta-gold/10 rounded-[32px] border border-augusta-gold/20">
                    <div className="flex items-center gap-3 mb-4">
                      <BarChart3 size={20} className="text-augusta-gold" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-augusta-gold">
                        Field Comparison
                      </span>
                    </div>
                    <h4 className="font-serif text-2xl font-bold text-masters-green mb-2 italic">
                      Rory vs Field
                    </h4>
                    <p className={cn("text-sm italic leading-relaxed", comparisonTone(comparison.vsField))}>
                      {comparisonNarrative(comparison.vsField, "field")}
                    </p>
                  </div>
                  <StatLine label="Rory Score" helper="Hole result" value={`${hole.score}`} />
                  <StatLine label="Field Average" helper="Full-field score benchmark" value={hole.fieldAvg?.toFixed(3) ?? "N/A"} />
                  <StatLine
                    label="Differential"
                    helper="Positive = scored better than the benchmark"
                    value={formatSigned(comparison.vsField, 3)}
                    tone={comparisonTone(comparison.vsField)}
                  />
                  {trajectoryPoint && (
                    <StatLine label="Field Cumulative" helper="After this hole" value={formatToPar(trajectoryPoint.fieldAvgToPar, 1)} />
                  )}
                </div>
              )}

              {focus === "vsTop10" && (
                <div className="space-y-6">
                  <div className="p-8 bg-augusta-gold/10 rounded-[32px] border border-augusta-gold/20">
                    <div className="flex items-center gap-3 mb-4">
                      <BarChart3 size={20} className="text-augusta-gold" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-augusta-gold">
                        Top 10 Comparison
                      </span>
                    </div>
                    <h4 className="font-serif text-2xl font-bold text-masters-green mb-2 italic">
                      Rory vs Top 10
                    </h4>
                    <p className={cn("text-sm italic leading-relaxed", comparisonTone(comparison.vsTop10))}>
                      {comparisonNarrative(comparison.vsTop10, "top 10 and ties")}
                    </p>
                  </div>
                  <StatLine label="Rory Score" helper="Hole result" value={`${hole.score}`} />
                  <StatLine label="Top 10 Average" helper="Contender score benchmark" value={hole.top10Avg?.toFixed(3) ?? "N/A"} />
                  <StatLine
                    label="Differential"
                    helper="Positive = scored better than the benchmark"
                    value={formatSigned(comparison.vsTop10, 3)}
                    tone={comparisonTone(comparison.vsTop10)}
                  />
                  {trajectoryPoint && (
                    <StatLine label="Top 10 Cumulative" helper="After this hole" value={formatToPar(trajectoryPoint.top10ToPar, 1)} />
                  )}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
