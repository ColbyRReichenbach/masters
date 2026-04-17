import type { HoleScore, RoundAnalysis } from "../../lib/data";
import { cn } from "../../lib/utils";
import { ScorecardRow } from "./ScorecardRow";

type ScorecardFocus = "rory" | "vsField" | "vsTop10";

interface TraditionalScorecardProps {
  round: RoundAnalysis;
  showFieldAvg: boolean;
  showTop10Avg: boolean;
  onSelectHole: (holeNumber: number, focus: ScorecardFocus) => void;
}

function getScoreClass(score: number, par: number) {
  const diff = score - par;
  if (diff <= -2) return "score-eagle text-masters-yellow";
  if (diff === -1) return "score-birdie text-masters-yellow";
  if (diff >= 1) return "score-bogey text-masters-green";
  return "score-par text-masters-green";
}

function sum(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0);
}

function formatAvg(value?: number) {
  return typeof value === "number" ? value.toFixed(2) : "-";
}

function deltaTone(value: number) {
  if (value > 0.005) return "text-masters-green";
  if (value < -0.005) return "text-under-par";
  return "text-ink-400";
}

function formatDelta(value: number) {
  const rounded = Number(value.toFixed(2));
  if (rounded === 0) return "0";
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

function Panel({
  label,
  holes,
  round,
  showFieldAvg,
  showTop10Avg,
  onSelectHole,
}: {
  label: "OUT" | "IN";
  holes: HoleScore[];
  round: RoundAnalysis;
  showFieldAvg: boolean;
  showTop10Avg: boolean;
  onSelectHole: (holeNumber: number, focus: ScorecardFocus) => void;
}) {
  const holeNumbers = holes.map((hole) => hole.holeNumber);
  const fieldDelta = holes.map((hole) => (hole.fieldAvg ?? hole.par) - hole.score);
  const top10Delta = holes.map((hole) => (hole.top10Avg ?? hole.par) - hole.score);

  return (
    <div className={label === "OUT" ? "border-b-4 border-masters-green/20" : undefined}>
      <ScorecardRow
        label="Hole"
        values={holes.map((hole) => hole.holeNumber)}
        subtotal={label}
        variant="header"
        holeNumbers={holeNumbers}
      />
      <ScorecardRow
        label="Yardage"
        values={holes.map((hole) => hole.yardage)}
        subtotal={sum(holes.map((hole) => hole.yardage))}
        holeNumbers={holeNumbers}
      />
      <ScorecardRow
        label="Par"
        values={holes.map((hole) => hole.par)}
        subtotal={sum(holes.map((hole) => hole.par))}
        holeNumbers={holeNumbers}
      />
      <ScorecardRow
        label="Score"
        values={holes.map((hole) => (
          <span key={hole.holeNumber} className={cn(getScoreClass(hole.score, hole.par), "transition-transform")}>
            {hole.score}
          </span>
        ))}
        subtotal={sum(holes.map((hole) => hole.score))}
        variant="score"
        holeNumbers={holeNumbers}
        onSelectHole={(holeNumber) => onSelectHole(holeNumber, "rory")}
      />
      {showFieldAvg && (
        <>
          <ScorecardRow
            label="Field Avg"
            values={holes.map((hole) => formatAvg(hole.fieldAvg))}
            subtotal="-"
            variant="benchmark"
            holeNumbers={holeNumbers}
            onSelectHole={(holeNumber) => onSelectHole(holeNumber, "vsField")}
          />
          <ScorecardRow
            label="Delta"
            values={fieldDelta.map((value, index) => (
              <span key={`field-delta-${holes[index].holeNumber}`} className={deltaTone(value)}>
                {formatDelta(value)}
              </span>
            ))}
            subtotal={formatDelta(sum(fieldDelta))}
            variant="delta"
            holeNumbers={holeNumbers}
            onSelectHole={(holeNumber) => onSelectHole(holeNumber, "vsField")}
          />
        </>
      )}
      {showTop10Avg && (
        <>
          <ScorecardRow
            label="Top 10"
            values={holes.map((hole) => formatAvg(hole.top10Avg))}
            subtotal="-"
            variant="benchmark"
            holeNumbers={holeNumbers}
            onSelectHole={(holeNumber) => onSelectHole(holeNumber, "vsTop10")}
          />
          <ScorecardRow
            label="Delta"
            values={top10Delta.map((value, index) => (
              <span key={`top10-delta-${holes[index].holeNumber}`} className={deltaTone(value)}>
                {formatDelta(value)}
              </span>
            ))}
            subtotal={formatDelta(sum(top10Delta))}
            variant="delta"
            holeNumbers={holeNumbers}
            onSelectHole={(holeNumber) => onSelectHole(holeNumber, "vsTop10")}
          />
        </>
      )}
    </div>
  );
}

export function TraditionalScorecard({
  round,
  showFieldAvg,
  showTop10Avg,
  onSelectHole,
}: TraditionalScorecardProps) {
  const outHoles = round.holes.slice(0, 9);
  const inHoles = round.holes.slice(9, 18);

  return (
    <div className="bg-white border-2 border-masters-green/20 rounded-xl overflow-hidden shadow-sm">
      <Panel
        label="OUT"
        holes={outHoles}
        round={round}
        showFieldAvg={showFieldAvg}
        showTop10Avg={showTop10Avg}
        onSelectHole={onSelectHole}
      />
      <Panel
        label="IN"
        holes={inHoles}
        round={round}
        showFieldAvg={showFieldAvg}
        showTop10Avg={showTop10Avg}
        onSelectHole={onSelectHole}
      />
      <div className="bg-masters-green text-white flex justify-between px-8 py-6 items-baseline font-serif">
        <div className="text-sm uppercase tracking-[0.4em] opacity-60 font-sans">
          Round {round.roundNumber} Completion
        </div>
        <div className="flex gap-12 text-5xl font-black">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-sans tracking-widest opacity-60 mb-1">
              Total
            </span>
            <span>{round.strokes}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-sans tracking-widest opacity-60 mb-1">
              To Par
            </span>
            <span className="text-masters-yellow">
              {round.toPar > 0 ? "+" : ""}
              {round.toPar}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

