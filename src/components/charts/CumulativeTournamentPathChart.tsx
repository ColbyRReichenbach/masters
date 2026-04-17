import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScorecardData } from "../../lib/data";
import { formatToPar } from "../../lib/chart-formatters";
import { BenchmarkToggle } from "../ui/BenchmarkToggle";
import { SectionHeader } from "../ui/SectionHeader";
import { ViewportAwareTooltip } from "../ui/ViewportAwareTooltip";

type Zoom = "all72" | "front36" | "back36";

interface CumulativeTournamentPathChartProps {
  data: ScorecardData["trajectory"];
  zoom: Zoom;
  onZoomChange: (zoom: Zoom) => void;
  onSelectHole: (holeNumber72: number) => void;
}

const ZOOM_RANGES: Record<Zoom, [number, number]> = {
  all72: [1, 72],
  front36: [1, 36],
  back36: [37, 72],
};

export function CumulativeTournamentPathChart({
  data,
  zoom,
  onZoomChange,
  onSelectHole,
}: CumulativeTournamentPathChartProps) {
  const [start, end] = ZOOM_RANGES[zoom];
  const visibleData = data
    .filter((point) => point.holeNumber >= start && point.holeNumber <= end)
    .map((point) => ({
      ...point,
      isEndOfRound: point.holeNumber % 18 === 0,
    }));

  return (
    <section className="bg-white rounded-[48px] p-10 md:p-14 border border-masters-green/10">
      <SectionHeader
        eyebrow="72-Hole Path"
        title="The Path to Victory"
        subtitle="Cumulative score-to-par versus the full field and the top-10 plus ties. The zoom controls only clip the visible x-range."
        actions={
          <BenchmarkToggle
            value={zoom}
            onChange={onZoomChange}
            options={[
              { value: "all72", label: "All 72" },
              { value: "front36", label: "Front 36" },
              { value: "back36", label: "Back 36" },
            ]}
          />
        }
      />

      <div className="h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={visibleData}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            onClick={(state) => {
              const point = (state as { activePayload?: Array<{ payload?: { holeNumber?: number } }> })?.activePayload?.[0]?.payload;
              if (point?.holeNumber) onSelectHole(point.holeNumber);
            }}
          >
            <defs>
              <linearGradient id="colorPath" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#004621" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#004621" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00462118" />
            <XAxis
              dataKey="holeNumber"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#00462170", fontWeight: "bold" }}
              dy={10}
              ticks={[18, 36, 54, 72].filter((tick) => tick >= start && tick <= end)}
            />
            <YAxis
              reversed
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#00462170", fontWeight: "bold" }}
              tickFormatter={(value) => formatToPar(Number(value), 0)}
            />
            <Tooltip
              offset={32}
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{ pointerEvents: "none", zIndex: 9999 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload;
                return (
                  <ViewportAwareTooltip className="bg-masters-green p-4 rounded-2xl shadow-premium border border-white/10 backdrop-blur-md min-w-64">
                    <span className="text-[10px] font-black uppercase tracking-widest text-masters-yellow mb-2 block">
                      Hole {point.holeNumber} Cumulative
                    </span>
                    <div className="space-y-2">
                      <div className="flex justify-between gap-8">
                        <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Rory</span>
                        <span className="text-white font-serif font-black">{formatToPar(point.cumulativeToPar, 1)}</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-white/45 text-[10px] font-bold uppercase tracking-widest">Field Avg</span>
                        <span className="text-white/70 font-serif font-black">{formatToPar(point.fieldAvgToPar, 1)}</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-masters-yellow text-[10px] font-bold uppercase tracking-widest">Top 10 + Ties</span>
                        <span className="text-masters-yellow font-serif font-black">{formatToPar(point.top10ToPar, 1)}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-white/50 italic mt-3 border-t border-white/10 pt-3">
                      Benchmarks are cumulative scoring averages through the same hole.
                    </p>
                  </ViewportAwareTooltip>
                );
              }}
            />
            <Area
              type="stepAfter"
              dataKey="cumulativeToPar"
              stroke="#004621"
              strokeWidth={4}
              fill="url(#colorPath)"
              activeDot={{ r: 6 }}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload.isEndOfRound) {
                  return <circle cx={cx} cy={cy} r={4} fill="#004621" stroke="white" strokeWidth={2} />;
                }
                return <circle cx={cx} cy={cy} r={2} fill="#004621" opacity={0.18} />;
              }}
            />
            <Area
              type="monotone"
              dataKey="fieldAvgToPar"
              stroke="#004621"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              fill="none"
              opacity={0.45}
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="top10ToPar"
              stroke="#ffcc00"
              strokeWidth={2}
              fill="none"
              opacity={0.85}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
