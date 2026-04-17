import type { PlayerTournamentStats } from "./data";

export type PlayerMetricKey =
  | "drivingDistanceAvgYards"
  | "drivingAccuracyPct"
  | "girPct"
  | "puttsPerGir"
  | "birdies"
  | "bogeys"
  | "doubles"
  | "scoreToPar";

export interface PlayerMetricConfig {
  key: PlayerMetricKey;
  label: string;
  shortLabel: string;
  unit: "yds" | "%" | "avg" | "count" | "toPar";
  directionality: "higher_better" | "lower_better";
  domainHint?: [number, number];
}

export const PLAYER_METRICS: Record<PlayerMetricKey, PlayerMetricConfig> = {
  drivingDistanceAvgYards: {
    key: "drivingDistanceAvgYards",
    label: "Driving Distance",
    shortLabel: "Distance",
    unit: "yds",
    directionality: "higher_better",
    domainHint: [260, 350],
  },
  drivingAccuracyPct: {
    key: "drivingAccuracyPct",
    label: "Fairway Accuracy",
    shortLabel: "Fairways",
    unit: "%",
    directionality: "higher_better",
    domainHint: [35, 95],
  },
  girPct: {
    key: "girPct",
    label: "Greens in Regulation",
    shortLabel: "GIR",
    unit: "%",
    directionality: "higher_better",
    domainHint: [30, 85],
  },
  puttsPerGir: {
    key: "puttsPerGir",
    label: "Putts per GIR",
    shortLabel: "Putts/GIR",
    unit: "avg",
    directionality: "lower_better",
    domainHint: [1.45, 2.1],
  },
  birdies: {
    key: "birdies",
    label: "Birdies",
    shortLabel: "Birdies",
    unit: "count",
    directionality: "higher_better",
  },
  bogeys: {
    key: "bogeys",
    label: "Bogeys",
    shortLabel: "Bogeys",
    unit: "count",
    directionality: "lower_better",
  },
  doubles: {
    key: "doubles",
    label: "Double Bogeys+",
    shortLabel: "Doubles+",
    unit: "count",
    directionality: "lower_better",
  },
  scoreToPar: {
    key: "scoreToPar",
    label: "Score to Par",
    shortLabel: "To Par",
    unit: "toPar",
    directionality: "lower_better",
  },
};

export const PROFILE_KPI_KEYS: PlayerMetricKey[] = [
  "drivingDistanceAvgYards",
  "girPct",
  "puttsPerGir",
  "birdies",
];

export function formatToPar(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  const rounded = Number(value.toFixed(digits));
  if (rounded === 0) return "E";
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

export function formatSigned(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  const rounded = Number(value.toFixed(digits));
  if (rounded === 0) return "0";
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

export function formatMetricValue(
  value: number | null | undefined,
  key: PlayerMetricKey,
  compact = false
) {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  const metric = PLAYER_METRICS[key];
  if (metric.unit === "toPar") return formatToPar(value, 0);
  if (metric.unit === "avg") return value.toFixed(3);
  if (metric.unit === "%") return `${value.toFixed(compact ? 0 : 1)}%`;
  if (metric.unit === "yds") return `${value.toFixed(compact ? 0 : 1)}`;
  return `${Math.round(value)}`;
}

export function metricUnitLabel(key: PlayerMetricKey) {
  const unit = PLAYER_METRICS[key].unit;
  if (unit === "toPar" || unit === "count") return "";
  return unit;
}

export function getPlayerDisplayName(player: PlayerTournamentStats | null | undefined) {
  return player?.playerName ?? "Selected Player";
}

