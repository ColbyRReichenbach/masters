import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { PlayerTournamentStats } from "../../lib/data";
import {
  PLAYER_METRICS,
  formatMetricValue,
  type PlayerMetricKey,
} from "../../lib/chart-formatters";
import { getMetricAverages, getMetricValue } from "../../lib/selectors";
import { AxisMetricSelect } from "../ui/AxisMetricSelect";
import { PlayerSearchSelect } from "../ui/PlayerSearchSelect";
import { SectionHeader } from "../ui/SectionHeader";
import { ViewportAwareTooltip } from "../ui/ViewportAwareTooltip";

interface ArchetypeScatterChartProps {
  players: PlayerTournamentStats[];
  xMetric: PlayerMetricKey;
  yMetric: PlayerMetricKey;
  selectedPlayerSlug: string | null;
  cohort: "all" | "top10";
  allPlayers: PlayerTournamentStats[];
  onXMetricChange: (metric: PlayerMetricKey) => void;
  onYMetricChange: (metric: PlayerMetricKey) => void;
  onSelectPlayer: (playerSlug: string) => void;
  onOpenPlayer: (playerSlug: string) => void;
}

export function ArchetypeScatterChart({
  players,
  xMetric,
  yMetric,
  selectedPlayerSlug,
  cohort,
  allPlayers,
  onXMetricChange,
  onYMetricChange,
  onSelectPlayer,
  onOpenPlayer,
}: ArchetypeScatterChartProps) {
  const averages = getMetricAverages(players);
  const data = players
    .map((player) => ({
      ...player,
      x: getMetricValue(player, xMetric),
      y: getMetricValue(player, yMetric),
      isRory: player.playerSlug === "rory-mcilroy",
      isSelected: player.playerSlug === selectedPlayerSlug,
    }))
    .filter((item) => item.x !== null && item.y !== null);
  const xValues = data.map((item) => item.x).filter((value): value is number => value !== null);
  const yValues = data.map((item) => item.y).filter((value): value is number => value !== null);
  const getDomain = (values: number[]): [number, number] => {
    if (!values.length) return [0, 1];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max((max - min || 1) * 0.12, 0.01);
    return [Number((min - padding).toFixed(3)), Number((max + padding).toFixed(3))];
  };

  return (
    <section className="bg-white rounded-2xl sm:rounded-[32px] md:rounded-[48px] p-4 sm:p-6 md:p-14 border border-masters-green/10">
      <SectionHeader
        eyebrow="Player Archetypes"
        title="Shape of the Field"
        subtitle={`Scatter view for ${cohort === "all" ? "all players" : "the top 10 plus ties"}. Rory stays labeled, and field-average reference lines give the plot its benchmark context.`}
        actions={
          <div className="flex min-w-0 flex-wrap gap-3">
            <AxisMetricSelect label="X Axis" value={xMetric} onChange={onXMetricChange} disabledMetric={yMetric} />
            <AxisMetricSelect label="Y Axis" value={yMetric} onChange={onYMetricChange} disabledMetric={xMetric} />
            <PlayerSearchSelect players={allPlayers} value={selectedPlayerSlug} onChange={onSelectPlayer} compact />
          </div>
        }
      />

      <div className="w-full overflow-x-auto pb-2">
        <div className="h-[340px] md:h-[430px] min-w-[620px] md:min-w-0">
          <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 25, right: 35, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#00462118" />
            <XAxis
              type="number"
              dataKey="x"
              name={PLAYER_METRICS[xMetric].label}
              domain={getDomain(xValues)}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#00462170", fontWeight: "bold" }}
              tickFormatter={(value) => formatMetricValue(Number(value), xMetric, true)}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={PLAYER_METRICS[yMetric].label}
              domain={getDomain(yValues)}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#00462170", fontWeight: "bold" }}
              tickFormatter={(value) => formatMetricValue(Number(value), yMetric, true)}
            />
            <ZAxis range={[70, 140]} />
            {averages[xMetric] !== null && (
              <ReferenceLine
                x={averages[xMetric] ?? undefined}
                stroke="#8A7246"
                strokeDasharray="5 5"
                label={{
                  value: `${PLAYER_METRICS[xMetric].shortLabel} field avg`,
                  position: "insideBottomRight",
                  fill: "#8A7246",
                  fontSize: 10,
                  fontWeight: 900,
                }}
              />
            )}
            {averages[yMetric] !== null && (
              <ReferenceLine
                y={averages[yMetric] ?? undefined}
                stroke="#8A7246"
                strokeDasharray="5 5"
                label={{
                  value: `${PLAYER_METRICS[yMetric].shortLabel} field avg`,
                  position: "insideTopLeft",
                  fill: "#8A7246",
                  fontSize: 10,
                  fontWeight: 900,
                }}
              />
            )}
            <Tooltip
              offset={32}
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{ pointerEvents: "none", zIndex: 9999 }}
              cursor={{ strokeDasharray: "3 3", stroke: "#00462140" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const player = payload[0].payload;
                return (
                  <ViewportAwareTooltip className="bg-masters-green p-4 rounded-2xl shadow-premium border border-white/10 min-w-64">
                    <span className="text-[10px] font-black uppercase tracking-widest text-masters-yellow mb-2 block">
                      {player.positionLabel} · {player.playerName}
                    </span>
                    <div className="space-y-2">
                      <div className="flex justify-between gap-6">
                        <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{PLAYER_METRICS[xMetric].shortLabel}</span>
                        <span className="text-white font-serif font-black">{formatMetricValue(player.x, xMetric)}</span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{PLAYER_METRICS[yMetric].shortLabel}</span>
                        <span className="text-white font-serif font-black">{formatMetricValue(player.y, yMetric)}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-white/50 italic mt-3 border-t border-white/10 pt-3">
                      Reference lines are cohort averages for the selected axes.
                    </p>
                  </ViewportAwareTooltip>
                );
              }}
            />
            <Scatter
              data={data}
              shape={(props) => {
                const { cx, cy, payload } = props;
                const r = payload.isRory ? 8 : payload.isSelected ? 7 : 4;
                const fill = payload.isRory ? "#004621" : payload.isSelected ? "#b91c1c" : "#8A7246";
                return (
                  <g onClick={() => onOpenPlayer(payload.playerSlug)} className="cursor-pointer">
                    <circle cx={cx} cy={cy} r={r} fill={fill} opacity={payload.isRory || payload.isSelected ? 1 : 0.42} stroke="white" strokeWidth={2} />
                    {(payload.isRory || payload.isSelected) && (
                      <text x={cx + 10} y={cy - 8} fill="#004621" fontSize={10} fontWeight={900}>
                        {payload.isRory ? "Rory" : payload.playerName.split(" ").at(-1)}
                      </text>
                    )}
                  </g>
                );
              }}
            />
          </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
