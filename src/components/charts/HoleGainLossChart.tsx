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
import { formatSigned } from "../../lib/chart-formatters";
import { BenchmarkToggle } from "../ui/BenchmarkToggle";
import { SectionHeader } from "../ui/SectionHeader";
import { ViewportAwareTooltip } from "../ui/ViewportAwareTooltip";

type RoundFilter = "all" | 1 | 2 | 3 | 4;
type SegmentFilter = "all" | "front9" | "back9" | "par3" | "par4" | "par5";

interface HoleGainLossChartProps {
  data: Array<{
    holeNumber: number;
    holeName: string;
    par: number;
    totalGainLoss: number;
    perRound: Array<{ roundNumber: number; value: number }>;
  }>;
  benchmark: "field" | "top10";
  roundFilter: RoundFilter;
  segmentFilter: SegmentFilter;
  onBenchmarkChange: (benchmark: "field" | "top10") => void;
  onRoundFilterChange: (roundFilter: RoundFilter) => void;
  onSegmentFilterChange: (segment: SegmentFilter) => void;
  onSelectHole: (holeNumber: number, focus: "vsField" | "vsTop10") => void;
}

const roundOptions: Array<{ value: RoundFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: 1, label: "R1" },
  { value: 2, label: "R2" },
  { value: 3, label: "R3" },
  { value: 4, label: "R4" },
];

const segmentOptions: Array<{ value: SegmentFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "front9", label: "Front" },
  { value: "back9", label: "Back" },
  { value: "par3", label: "Par 3" },
  { value: "par4", label: "Par 4" },
  { value: "par5", label: "Par 5" },
];

export function HoleGainLossChart({
  data,
  benchmark,
  roundFilter,
  segmentFilter,
  onBenchmarkChange,
  onRoundFilterChange,
  onSegmentFilterChange,
  onSelectHole,
}: HoleGainLossChartProps) {
  const biggestGain = [...data].sort((a, b) => b.totalGainLoss - a.totalGainLoss)[0];
  const biggestLoss = [...data].sort((a, b) => a.totalGainLoss - b.totalGainLoss)[0];
  const focus = benchmark === "field" ? "vsField" : "vsTop10";

  return (
    <section className="bg-white rounded-2xl sm:rounded-[32px] md:rounded-[48px] p-4 sm:p-6 md:p-14 border border-masters-green/10">
      <SectionHeader
        eyebrow="Hole Gain / Loss"
        title="Where the Shots Moved"
        subtitle={`Each bar shows Rory's scoring differential versus the ${benchmark === "field" ? "full field" : "top 10 plus ties"} average for the selected scope. Positive means he scored better than the benchmark on that hole.`}
        actions={
          <div className="flex min-w-0 flex-wrap gap-3">
            <BenchmarkToggle
              value={benchmark}
              onChange={onBenchmarkChange}
              options={[
                { value: "field", label: "Field" },
                { value: "top10", label: "Top 10" },
              ]}
              tone="gold"
            />
            <BenchmarkToggle value={roundFilter} onChange={onRoundFilterChange} options={roundOptions} />
            <BenchmarkToggle value={segmentFilter} onChange={onSegmentFilterChange} options={segmentOptions} />
          </div>
        }
      />

      <div className="w-full overflow-x-auto pb-2">
        <div className="h-[320px] md:h-[340px] min-w-[620px] md:min-w-0">
          <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00462118" />
            <XAxis
              dataKey="holeNumber"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#00462170", fontWeight: "bold" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#00462170", fontWeight: "bold" }}
              tickFormatter={(value) => formatSigned(Number(value), 1)}
            />
            <ReferenceLine y={0} stroke="#004621" strokeOpacity={0.25} />
            <Tooltip
              offset={32}
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{ pointerEvents: "none", zIndex: 9999 }}
              cursor={{ fill: "rgba(0,70,33,0.05)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload;
                return (
                  <ViewportAwareTooltip className="bg-masters-green p-4 rounded-2xl shadow-premium border border-white/10 backdrop-blur-md min-w-64">
                    <span className="text-[10px] font-black uppercase tracking-widest text-masters-yellow mb-1 block">
                      Hole {row.holeNumber} · Par {row.par}
                    </span>
                    <h4 className="font-serif text-xl font-black !text-white mb-3">{row.holeName}</h4>
                    <div className="flex justify-between gap-8 border-b border-white/10 pb-3 mb-3">
                      <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Total</span>
                      <span className="text-white font-serif font-black">{formatSigned(row.totalGainLoss, 3)}</span>
                    </div>
                    {row.perRound.map((item: { roundNumber: number; value: number }) => (
                      <div key={item.roundNumber} className="flex justify-between gap-8 py-1">
                        <span className="text-white/45 text-[10px] font-bold uppercase tracking-widest">
                          Round {item.roundNumber}
                        </span>
                        <span className="text-white/75 font-serif font-black">{formatSigned(item.value, 3)}</span>
                      </div>
                    ))}
                    <p className="text-[11px] text-white/50 italic mt-3 border-t border-white/10 pt-3">
                      Benchmark: Rory score versus {benchmark === "field" ? "full-field" : "top-10 plus ties"} average.
                    </p>
                  </ViewportAwareTooltip>
                );
              }}
            />
            <Bar
              dataKey="totalGainLoss"
              radius={[8, 8, 8, 8]}
              onClick={(row) => onSelectHole(row.holeNumber, focus)}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.holeNumber}
                  fill={entry.totalGainLoss > 0 ? "#004621" : entry.totalGainLoss < 0 ? "#b91c1c" : "#8A7246"}
                  fillOpacity={entry.totalGainLoss === 0 ? 0.45 : 0.88}
                />
              ))}
            </Bar>
          </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 md:mt-8">
        {[
          { label: "Biggest Gain", item: biggestGain, tone: "text-masters-green" },
          { label: "Biggest Loss", item: biggestLoss, tone: "text-under-par" },
        ].map(({ label, item, tone }) => (
          <button
            key={label}
            type="button"
            onClick={() => item && onSelectHole(item.holeNumber, focus)}
            className="text-left bg-bg-cream-dark rounded-2xl md:rounded-3xl border border-masters-green/10 p-4 md:p-6 hover:bg-white transition-colors"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-ink-400 block mb-2">
              {label}
            </span>
            <div className="flex items-end justify-between gap-4">
              <span className="font-serif text-xl md:text-2xl font-black text-masters-green">
                {item?.holeName ?? "N/A"}
                {item && (
                  <span className="ml-2 align-middle font-sans text-[10px] font-black uppercase tracking-[0.22em] text-masters-green/45">
                    Hole {item.holeNumber}
                  </span>
                )}
              </span>
              <span className={`font-serif text-2xl md:text-3xl font-black ${tone}`}>
                {item ? formatSigned(item.totalGainLoss, 2) : "N/A"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
