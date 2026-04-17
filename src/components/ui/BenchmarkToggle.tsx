import { cn } from "../../lib/utils";

interface BenchmarkToggleProps<T extends string | number> {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  tone?: "green" | "gold";
}

export function BenchmarkToggle<T extends string | number>({
  value,
  options,
  onChange,
  tone = "green",
}: BenchmarkToggleProps<T>) {
  const activeClass = tone === "gold" ? "bg-augusta-gold text-white" : "bg-masters-green text-white";
  const idleClass = tone === "gold" ? "text-augusta-gold hover:bg-augusta-gold/10" : "text-masters-green/55 hover:text-masters-green hover:bg-masters-green/10";

  return (
    <div className="inline-flex w-fit max-w-full flex-nowrap gap-1 overflow-x-auto bg-white/70 p-1 rounded-2xl border border-masters-green/10 font-sans shadow-inner">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "shrink-0 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            value === option.value ? activeClass : idleClass
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
