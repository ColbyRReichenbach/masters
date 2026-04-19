import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatSigned, formatToPar } from "../../lib/chart-formatters";
import type { RepeatTrajectoryPoint, RepeatZoom } from "../../lib/selectors";
import { BenchmarkToggle } from "../ui/BenchmarkToggle";
import { SectionHeader } from "../ui/SectionHeader";
import { ViewportAwareTooltip } from "../ui/ViewportAwareTooltip";

interface RepeatPathChartProps {
  data: RepeatTrajectoryPoint[];
  zoom: RepeatZoom;
  onZoomChange: (zoom: RepeatZoom) => void;
  onSelectHole: (holeNumber72: number) => void;
}

const zoomRanges: Record<RepeatZoom, [number, number]> = {
  all72: [1, 72],
  front36: [1, 36],
  back36: [37, 72],
};

export function RepeatPathChart({ data, zoom, onZoomChange, onSelectHole }: RepeatPathChartProps) {
  const [start, end] = zoomRanges[zoom];
  const visibleData = data.filter((point) => point.holeNumber >= start && point.holeNumber <= end);
  const selectPayloadPoint = (payload?: { holeNumber?: number }) => {
    if (payload?.holeNumber) onSelectHole(payload.holeNumber);
  };
  const renderClickableDot = (props: { cx?: number; cy?: number; payload?: RepeatTrajectoryPoint }) => {
    const { cx, cy, payload } = props;
    if (typeof cx !== "number" || typeof cy !== "number" || !payload) return <g />;
    const isRoundBoundary = payload.holeNumber % 18 === 0;
    return (
      <g
        role="button"
        tabIndex={0}
        className="cursor-pointer"
        onClick={() => selectPayloadPoint(payload)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") selectPayloadPoint(payload);
        }}
        aria-label={`Select cumulative hole ${payload.holeNumber}`}
      >
        <circle cx={cx} cy={cy} r={10} fill="transparent" />
        <circle
          cx={cx}
          cy={cy}
          r={isRoundBoundary ? 4 : 2}
          fill="#004621"
          opacity={isRoundBoundary ? 1 : 0.18}
          stroke={isRoundBoundary ? "white" : "transparent"}
          strokeWidth={isRoundBoundary ? 2 : 0}
        />
      </g>
    );
  };
  const renderActiveDot = (props: { cx?: number; cy?: number; payload?: RepeatTrajectoryPoint; stroke?: string }) => {
    const { cx, cy, payload, stroke } = props;
    if (typeof cx !== "number" || typeof cy !== "number" || !payload) return <g />;
    return (
      <g
        role="button"
        tabIndex={0}
        className="cursor-pointer"
        onClick={() => selectPayloadPoint(payload)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") selectPayloadPoint(payload);
        }}
        aria-label={`Select cumulative hole ${payload.holeNumber}`}
      >
        <circle cx={cx} cy={cy} r={12} fill="transparent" />
        <circle cx={cx} cy={cy} r={6} fill={stroke ?? "#004621"} stroke="white" strokeWidth={2} />
      </g>
    );
  };

  return (
    <section className="bg-white rounded-2xl sm:rounded-[32px] md:rounded-[48px] p-4 sm:p-6 md:p-14 border border-masters-green/10">
      <SectionHeader
        eyebrow="Repeat Path"
        title="Two Title Runs, Same Route"
        subtitle="Rory’s 2025 breakthrough and 2026 defense are aligned to the same 72-hole x-axis. Click a point to sync the hole matrix."
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
      <div className="w-full overflow-x-auto pb-2">
        <div className="h-[320px] md:h-[430px] min-w-[560px] md:min-w-0">
          <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={visibleData}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            onClick={(state) => {
              const point = (state as { activePayload?: Array<{ payload?: { holeNumber?: number } }> })
                ?.activePayload?.[0]?.payload;
              selectPayloadPoint(point);
            }}
          >
            <defs>
              <linearGradient id="repeatPathFill" x1="0" y1="0" x2="0" y2="1">
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
                const point = payload[0].payload as RepeatTrajectoryPoint;
                const delta = point.y2026CumulativeToPar - point.y2025CumulativeToPar;
                return (
                  <ViewportAwareTooltip className="bg-masters-green p-4 rounded-2xl shadow-premium border border-white/10 min-w-64">
                    <span className="text-[10px] font-black uppercase tracking-widest text-masters-yellow mb-2 block">
                      Hole {point.holeNumber} Cumulative
                    </span>
                    <div className="space-y-2">
                      <div className="flex justify-between gap-8">
                        <span className="text-white/55 text-[10px] font-bold uppercase tracking-widest">2025</span>
                        <span className="text-white font-serif font-black">{formatToPar(point.y2025CumulativeToPar, 1)}</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-masters-yellow text-[10px] font-bold uppercase tracking-widest">2026</span>
                        <span className="text-masters-yellow font-serif font-black">{formatToPar(point.y2026CumulativeToPar, 1)}</span>
                      </div>
                      <div className="flex justify-between gap-8 border-t border-white/10 pt-2">
                        <span className="text-white/45 text-[10px] font-bold uppercase tracking-widest">Delta</span>
                        <span className="text-white/75 font-serif font-black">{formatSigned(delta, 1)}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-white/50 italic mt-3 border-t border-white/10 pt-3">
                      Delta is 2026 cumulative score minus 2025 cumulative score.
                    </p>
                  </ViewportAwareTooltip>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="y2025CumulativeToPar"
              stroke="#8A7246"
              strokeDasharray="5 5"
              strokeWidth={2}
              fill="transparent"
              dot={false}
              activeDot={renderActiveDot}
            />
            <Area
              type="stepAfter"
              dataKey="y2026CumulativeToPar"
              stroke="#004621"
              strokeWidth={4}
              fill="url(#repeatPathFill)"
              activeDot={renderActiveDot}
              dot={renderClickableDot}
            />
          </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-6 md:mt-8 flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <span className="w-8 h-0.5 border-t-2 border-dashed border-augusta-gold" />
          <span className="text-[10px] font-black uppercase tracking-widest text-ink-400">2025</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-8 h-1 rounded-full bg-masters-green" />
          <span className="text-[10px] font-black uppercase tracking-widest text-ink-400">2026</span>
        </div>
      </div>
    </section>
  );
}
