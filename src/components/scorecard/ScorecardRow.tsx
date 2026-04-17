import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface ScorecardRowProps {
  label: string;
  values: ReactNode[];
  subtotal?: ReactNode;
  variant?: "header" | "body" | "score" | "benchmark" | "delta";
  holeNumbers: number[];
  onSelectHole?: (holeNumber: number) => void;
}

export function ScorecardRow({
  label,
  values,
  subtotal,
  variant = "body",
  holeNumbers,
  onSelectHole,
}: ScorecardRowProps) {
  const isHeader = variant === "header";
  const isBenchmark = variant === "benchmark";
  const isDelta = variant === "delta";

  return (
    <div
      className={cn(
        "grid-scorecard border-b border-masters-green/10 items-center transition-all",
        isHeader ? "bg-masters-green text-white font-bold py-2" : "py-3",
        isBenchmark && "bg-masters-green/5 text-masters-green/70 italic font-medium",
        isDelta && "bg-bg-cream-dark/70 text-masters-green font-black"
      )}
    >
      <div className="pl-4 text-[10px] uppercase tracking-widest font-black opacity-60">
        {label}
      </div>
      {values.map((value, index) => {
        const holeNumber = holeNumbers[index];
        return (
          <button
            key={`${label}-${holeNumber}-${index}`}
            type="button"
            disabled={!onSelectHole || !holeNumber}
            onClick={() => holeNumber && onSelectHole?.(holeNumber)}
            className={cn(
              "min-h-9 text-center font-serif text-lg transition-transform flex items-center justify-center",
              onSelectHole && "cursor-pointer hover:scale-110",
              !onSelectHole && "cursor-default",
              isBenchmark && "text-masters-green/70 hover:text-masters-green",
              isHeader && "font-sans text-xs"
            )}
          >
            {value}
          </button>
        );
      })}
      <div className="text-center font-black bg-masters-green/5 h-full min-h-9 flex items-center justify-center border-l border-masters-green/10">
        {subtotal}
      </div>
    </div>
  );
}

