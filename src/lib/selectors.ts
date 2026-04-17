import type {
  CourseHoleStatsRow,
  HoleScore,
  PlayerScorecard,
  PlayerTournamentStats,
  ProfileData,
  ProfileMetric,
  RepeatChampionBenchmarkRow,
  RoryRepeatScorecardData,
  RoundAnalysis,
  ScorecardData,
  TournamentStatAverages,
} from "./data";
import { PLAYER_METRICS, type PlayerMetricKey } from "./chart-formatters";

type RoundNumber = 1 | 2 | 3 | 4;
type SegmentFilter = "all" | "front9" | "back9" | "par3" | "par4" | "par5";
export type RepeatZoom = "all72" | "front36" | "back36";

export function getRound(scorecard: ScorecardData, roundNumber: RoundNumber): RoundAnalysis {
  const round = scorecard.rounds.find((item) => item.roundNumber === roundNumber);
  if (!round) throw new Error(`Round ${roundNumber} not found`);
  return round;
}

export function getHoleByRoundAndNumber(
  scorecard: ScorecardData,
  roundNumber: RoundNumber,
  holeNumber: number
): HoleScore | null {
  return getRound(scorecard, roundNumber).holes.find((hole) => hole.holeNumber === holeNumber) ?? null;
}

export function getTournamentHoleDifficulty(scorecard: ScorecardData): Record<number, number> {
  const holeDeltas = new Map<number, { total: number; count: number }>();

  scorecard.rounds.forEach((round) => {
    round.holes.forEach((hole) => {
      const current = holeDeltas.get(hole.holeNumber) ?? { total: 0, count: 0 };
      current.total += (hole.fieldAvg ?? hole.par) - hole.par;
      current.count += 1;
      holeDeltas.set(hole.holeNumber, current);
    });
  });

  return Array.from(holeDeltas.entries())
    .map(([holeNumber, value]) => ({
      holeNumber,
      avgToPar: value.count ? value.total / value.count : 0,
    }))
    .sort((a, b) => b.avgToPar - a.avgToPar)
    .reduce<Record<number, number>>((acc, item, index) => {
      acc[item.holeNumber] = index + 1;
      return acc;
    }, {});
}

export function getRoryHoleTournamentAverage(scorecard: ScorecardData, holeNumber: number): number {
  const values = scorecard.rounds
    .map((round) => round.holes.find((hole) => hole.holeNumber === holeNumber)?.score)
    .filter((value): value is number => typeof value === "number");

  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

export function getHoleComparison(hole: HoleScore): { vsField: number; vsTop10: number } {
  return {
    vsField: Number(((hole.fieldAvg ?? hole.par) - hole.score).toFixed(3)),
    vsTop10: Number(((hole.top10Avg ?? hole.par) - hole.score).toFixed(3)),
  };
}

export function getTrajectoryPoint(
  trajectory: ScorecardData["trajectory"],
  roundNumber: RoundNumber,
  holeNumber: number
) {
  const holeNumber72 = (roundNumber - 1) * 18 + holeNumber;
  return trajectory.find((point) => point.holeNumber === holeNumber72) ?? null;
}

function matchesSegment(hole: Pick<HoleScore, "holeNumber" | "par">, segment: SegmentFilter) {
  if (segment === "front9") return hole.holeNumber <= 9;
  if (segment === "back9") return hole.holeNumber >= 10;
  if (segment === "par3") return hole.par === 3;
  if (segment === "par4") return hole.par === 4;
  if (segment === "par5") return hole.par === 5;
  return true;
}

export function getHoleGainLossSeries(
  scorecard: ScorecardData,
  benchmark: "field" | "top10",
  roundFilter: "all" | RoundNumber,
  segmentFilter: SegmentFilter
): Array<{
  holeNumber: number;
  holeName: string;
  par: number;
  totalGainLoss: number;
  perRound: Array<{ roundNumber: number; value: number }>;
}> {
  const rows = new Map<
    number,
    {
      holeNumber: number;
      holeName: string;
      par: number;
      totalGainLoss: number;
      perRound: Array<{ roundNumber: number; value: number }>;
    }
  >();

  scorecard.rounds.forEach((round) => {
    if (roundFilter !== "all" && round.roundNumber !== roundFilter) return;

    round.holes.forEach((hole) => {
      if (!matchesSegment(hole, segmentFilter)) return;
      const comparison = benchmark === "field" ? hole.fieldAvg : hole.top10Avg;
      const value = Number(((comparison ?? hole.par) - hole.score).toFixed(3));
      const row = rows.get(hole.holeNumber) ?? {
        holeNumber: hole.holeNumber,
        holeName: hole.holeName ?? `Hole ${hole.holeNumber}`,
        par: hole.par,
        totalGainLoss: 0,
        perRound: [],
      };

      row.totalGainLoss = Number((row.totalGainLoss + value).toFixed(3));
      row.perRound.push({ roundNumber: round.roundNumber, value });
      rows.set(hole.holeNumber, row);
    });
  });

  return Array.from(rows.values()).sort((a, b) => a.holeNumber - b.holeNumber);
}

export function getCourseHoleDifficultyRows(courseRows: CourseHoleStatsRow[]) {
  return [...courseRows]
    .filter((row) => row.avgToPar !== null)
    .sort((a, b) => (b.avgToPar ?? 0) - (a.avgToPar ?? 0))
    .map((row, index) => ({ ...row, difficultyRank: index + 1 }));
}

export function getCohortPlayers(players: PlayerTournamentStats[], cohort: "all" | "top10") {
  if (cohort === "top10") {
    return players.filter((player) => player.positionNumber !== null && player.positionNumber <= 10);
  }
  return players;
}

export function getMetricValue(player: PlayerTournamentStats, key: PlayerMetricKey): number | null {
  return player[key] ?? null;
}

export function getMetricDistribution(
  players: PlayerTournamentStats[],
  metric: PlayerMetricKey,
  binCount: number
) {
  const values = players
    .map((player) => ({ player, value: getMetricValue(player, metric) }))
    .filter((item): item is { player: PlayerTournamentStats; value: number } => item.value !== null);

  if (!values.length) return [];

  const rawMin = Math.min(...values.map((item) => item.value));
  const rawMax = Math.max(...values.map((item) => item.value));
  const spread = rawMax - rawMin || 1;
  const padding = spread * 0.02;
  const min = rawMin - padding;
  const max = rawMax + padding;
  const size = (max - min) / binCount;

  return Array.from({ length: binCount }, (_, index) => {
    const binStart = min + index * size;
    const binEnd = index === binCount - 1 ? max : binStart + size;
    const binPlayers = values
      .filter((item) => item.value >= binStart && (index === binCount - 1 ? item.value <= binEnd : item.value < binEnd))
      .map((item) => item.player);

    return {
      binStart: Number(binStart.toFixed(3)),
      binEnd: Number(binEnd.toFixed(3)),
      count: binPlayers.length,
      players: binPlayers,
    };
  });
}

export function getMetricAverages(players: PlayerTournamentStats[]) {
  return Object.keys(PLAYER_METRICS).reduce<Record<PlayerMetricKey, number | null>>((acc, key) => {
    const metricKey = key as PlayerMetricKey;
    const values = players
      .map((player) => getMetricValue(player, metricKey))
      .filter((value): value is number => value !== null && Number.isFinite(value));

    acc[metricKey] = values.length
      ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3))
      : null;
    return acc;
  }, {} as Record<PlayerMetricKey, number | null>);
}

function applyTournamentStatAverages(
  averages: Record<PlayerMetricKey, number | null>,
  source: TournamentStatAverages["field"]
) {
  return {
    ...averages,
    drivingDistanceAvgYards: source.driving_dist ?? averages.drivingDistanceAvgYards,
    drivingAccuracyPct: source.fairway_pct ?? averages.drivingAccuracyPct,
    girPct: source.gir_pct ?? averages.girPct,
    puttsPerGir: source.putts_gir ?? averages.puttsPerGir,
  } satisfies Record<PlayerMetricKey, number | null>;
}

export function getMetricAveragesWithTournamentSource(
  players: PlayerTournamentStats[],
  source: TournamentStatAverages["field"] = {}
) {
  return applyTournamentStatAverages(getMetricAverages(players), source);
}

function scorecardForPlayer(scorecards: PlayerScorecard[], player: PlayerTournamentStats) {
  return scorecards.find((scorecard) => scorecard.playerSlug === player.playerSlug) ?? null;
}

function scorecardRoundsPlayed(scorecard: PlayerScorecard | null) {
  return scorecard?.roundsPlayed ?? scorecard?.rounds?.length ?? 1;
}

function scorecardHolesPlayed(scorecard: PlayerScorecard | null) {
  return scorecard?.holesPlayed ?? scorecard?.rounds?.reduce((sum, round) => sum + round.holes.length, 0) ?? 1;
}

function scorecardFairwayOpportunities(scorecard: PlayerScorecard | null) {
  return (
    scorecard?.rounds?.reduce(
      (sum, round) => sum + round.holes.filter((hole) => hole.par !== 3).length,
      0
    ) ?? 1
  );
}

function weightedAverage(entries: Array<{ value: number | null; weight: number }>) {
  const validEntries = entries.filter(
    (entry) =>
      entry.value !== null &&
      Number.isFinite(entry.value) &&
      Number.isFinite(entry.weight) &&
      entry.weight > 0
  ) as Array<{ value: number; weight: number }>;

  const weightSum = validEntries.reduce((sum, entry) => sum + entry.weight, 0);
  if (!weightSum) return null;

  return Number(
    (validEntries.reduce((sum, entry) => sum + entry.value * entry.weight, 0) / weightSum).toFixed(3)
  );
}

export function getWeightedMetricAverages(
  players: PlayerTournamentStats[],
  scorecards: PlayerScorecard[]
) {
  const simpleAverages = getMetricAverages(players);
  const entries = players.map((player) => ({
    player,
    scorecard: scorecardForPlayer(scorecards, player),
  }));

  return {
    ...simpleAverages,
    drivingDistanceAvgYards: weightedAverage(
      entries.map(({ player, scorecard }) => ({
        value: player.drivingDistanceAvgYards,
        weight: scorecardRoundsPlayed(scorecard),
      }))
    ),
    drivingAccuracyPct: weightedAverage(
      entries.map(({ player, scorecard }) => ({
        value: player.drivingAccuracyPct,
        weight: scorecardFairwayOpportunities(scorecard),
      }))
    ),
    girPct: weightedAverage(
      entries.map(({ player, scorecard }) => ({
        value: player.girPct,
        weight: scorecardHolesPlayed(scorecard),
      }))
    ),
    puttsPerGir: weightedAverage(
      entries.map(({ player, scorecard }) => {
        const holesPlayed = scorecardHolesPlayed(scorecard);
        const estimatedGirMade =
          typeof player.girPct === "number" && Number.isFinite(player.girPct)
            ? (player.girPct / 100) * holesPlayed
            : 0;

        return {
          value: player.puttsPerGir,
          weight: estimatedGirMade,
        };
      })
    ),
  } satisfies Record<PlayerMetricKey, number | null>;
}

type ProfileStatKey = PlayerMetricKey | "sandSavePct";

const profileMetricKeys: Record<string, ProfileStatKey> = {
  driving_dist: "drivingDistanceAvgYards",
  fairway_pct: "drivingAccuracyPct",
  gir_pct: "girPct",
  putts_gir: "puttsPerGir",
  sand_save_pct: "sandSavePct",
};

function getProfileMetricValue(
  player: PlayerTournamentStats | undefined,
  profileMetric: ProfileMetric
) {
  const metricKey = profileMetricKeys[profileMetric.key];
  if (!metricKey || !player) return profileMetric.winnerValue;
  if (metricKey === "sandSavePct") return player.sandSavePct ?? profileMetric.winnerValue;
  return getMetricValue(player, metricKey) ?? profileMetric.winnerValue;
}

function avgProfileStat(
  players: PlayerTournamentStats[],
  key: ProfileStatKey,
  scorecards: PlayerScorecard[] = []
) {
  if (key === "sandSavePct" && scorecards.length) {
    return weightedAverage(
      players.map((player) => ({
        value: player.sandSavePct ?? null,
        weight: scorecardRoundsPlayed(scorecardForPlayer(scorecards, player)),
      }))
    );
  }

  const values = players
    .map((player) => player[key])
    .filter((value): value is number => value !== null && value !== undefined && Number.isFinite(value));

  return values.length
    ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3))
    : null;
}

function formatProfileMetricValue(value: number, unit: string) {
  if (unit === "yds") return `${Number(value.toFixed(1))} yards`;
  if (unit === "%") return `${Number(value.toFixed(1))}%`;
  if (unit === "avg") return value.toFixed(3);
  return `${Number(value.toFixed(1))}`;
}

export function getDerivedWinnerProfile(
  profile: ProfileData,
  players: PlayerTournamentStats[],
  statAverages?: TournamentStatAverages
): ProfileData {
  const rory = players.find((player) => player.playerSlug === profile.player.slug);
  const top10Players = getCohortPlayers(players, "top10");
  const fieldAverages = getMetricAveragesWithTournamentSource(players, statAverages?.field);
  const top10Averages = getMetricAveragesWithTournamentSource(top10Players, statAverages?.top10);
  const metrics = profile.metrics.map((metric) => {
    const metricKey = profileMetricKeys[metric.key];
    if (!metricKey) return metric;

    const winnerValue = getProfileMetricValue(rory, metric);
    const fieldValue =
      metricKey === "sandSavePct"
        ? statAverages?.field.sand_save_pct ?? avgProfileStat(players, metricKey) ?? metric.fieldValue
        : fieldAverages[metricKey] ?? metric.fieldValue;
    const top10Value =
      metricKey === "sandSavePct"
        ? statAverages?.top10.sand_save_pct ?? avgProfileStat(top10Players, metricKey) ?? metric.top10Value
        : top10Averages[metricKey] ?? metric.top10Value;

    return {
      ...metric,
      winnerValue,
      fieldValue,
      top10Value,
      deltaVsField: Number((winnerValue - fieldValue).toFixed(3)),
    };
  });

  const metricByKey = new Map(metrics.map((metric) => [metric.key, metric]));
  const driving = metricByKey.get("driving_dist");
  const gir = metricByKey.get("gir_pct");
  const putts = metricByKey.get("putts_gir");
  const accuracy = metricByKey.get("fairway_pct");

  return {
    ...profile,
    metrics,
    verdicts: {
      primarySeparator: driving
        ? `At ${formatProfileMetricValue(driving.winnerValue, driving.unit)} per drive — ${formatProfileMetricValue(Math.abs(driving.winnerValue - driving.fieldValue), driving.unit)} ${driving.winnerValue >= driving.fieldValue ? "longer" : "shorter"} than the field average — Rory turned Augusta's par 5s and long par 4s into scoring opportunities others couldn't access.`
        : profile.verdicts.primarySeparator,
      secondarySupport: gir
        ? `Hitting ${formatProfileMetricValue(gir.winnerValue, gir.unit)} of greens in regulation — ${gir.winnerValue >= gir.fieldValue ? "above" : "below"} the field average — Rory consistently put himself in two-putt territory, the foundation of avoiding bogeys at Augusta.`
        : profile.verdicts.secondarySupport,
      weaknessOvercome: putts
        ? `${accuracy && accuracy.winnerValue < accuracy.fieldValue ? "Despite" : "And by"} hitting fairways ${accuracy && accuracy.winnerValue < accuracy.fieldValue ? "below" : "around"} the field average, Rory converted at ${formatProfileMetricValue(putts.winnerValue, putts.unit)} putts per GIR — ${putts.winnerValue <= putts.fieldValue ? "better" : "worse"} than the field's ${formatProfileMetricValue(putts.fieldValue, putts.unit)} — turning approach play into a net positive.`
        : profile.verdicts.weaknessOvercome,
    },
  };
}

export function getPlayerPercentile(
  players: PlayerTournamentStats[],
  key: PlayerMetricKey,
  playerSlug: string,
  directionality = PLAYER_METRICS[key].directionality
): number | null {
  const values = players
    .map((player) => ({ slug: player.playerSlug, value: getMetricValue(player, key) }))
    .filter((item): item is { slug: string; value: number } => item.value !== null && Number.isFinite(item.value));
  const target = values.find((item) => item.slug === playerSlug);
  if (!target || !values.length) return null;

  const betterOrEqual = values.filter((item) =>
    directionality === "higher_better" ? item.value <= target.value : item.value >= target.value
  ).length;

  return Math.round((betterOrEqual / values.length) * 100);
}

export function getMetricRank(
  players: PlayerTournamentStats[],
  key: PlayerMetricKey,
  playerSlug: string
): number | null {
  const directionality = PLAYER_METRICS[key].directionality;
  const values = players
    .map((player) => ({ slug: player.playerSlug, value: getMetricValue(player, key) }))
    .filter((item): item is { slug: string; value: number } => item.value !== null && Number.isFinite(item.value));
  const target = values.find((item) => item.slug === playerSlug);
  if (!target) return null;

  const betterPlayers = values.filter((item) =>
    directionality === "higher_better" ? item.value > target.value : item.value < target.value
  ).length;

  return betterPlayers + 1;
}

export function getSelectedPlayer(players: PlayerTournamentStats[], playerSlug: string | null) {
  if (!playerSlug) return null;
  return players.find((player) => player.playerSlug === playerSlug) ?? null;
}

export function getPlayerScoringProfile(player: PlayerTournamentStats | null) {
  if (!player) return null;
  const birdiePlus = (player.eagles ?? 0) + (player.birdies ?? 0);
  const pars = player.pars ?? 0;
  const bogeys = player.bogeys ?? 0;
  const doublePlus = player.doubles ?? 0;
  const total = birdiePlus + pars + bogeys + doublePlus;
  if (!total) return { birdiePlusPct: 0, parPct: 0, bogeyPct: 0, doublePlusPct: 0 };
  return {
    birdiePlusPct: Number(((birdiePlus / total) * 100).toFixed(1)),
    parPct: Number(((pars / total) * 100).toFixed(1)),
    bogeyPct: Number(((bogeys / total) * 100).toFixed(1)),
    doublePlusPct: Number(((doublePlus / total) * 100).toFixed(1)),
  };
}

export function getAggregateScoringProfile(players: PlayerTournamentStats[]) {
  const totals = players.reduce(
    (acc, player) => {
      acc.birdiePlus += (player.eagles ?? 0) + (player.birdies ?? 0);
      acc.par += player.pars ?? 0;
      acc.bogey += player.bogeys ?? 0;
      acc.doublePlus += player.doubles ?? 0;
      return acc;
    },
    { birdiePlus: 0, par: 0, bogey: 0, doublePlus: 0 }
  );
  const total = totals.birdiePlus + totals.par + totals.bogey + totals.doublePlus;
  if (!total) return { birdiePlusPct: 0, parPct: 0, bogeyPct: 0, doublePlusPct: 0 };
  return {
    birdiePlusPct: Number(((totals.birdiePlus / total) * 100).toFixed(1)),
    parPct: Number(((totals.par / total) * 100).toFixed(1)),
    bogeyPct: Number(((totals.bogey / total) * 100).toFixed(1)),
    doublePlusPct: Number(((totals.doublePlus / total) * 100).toFixed(1)),
  };
}

export function getDefaultComparisonPlayer(players: PlayerTournamentStats[], rorySlug: string) {
  return (
    players.find((player) => player.playerSlug.includes("scheffler")) ??
    [...players]
      .filter((player) => player.playerSlug !== rorySlug && player.positionNumber !== null)
      .sort((a, b) => (a.positionNumber ?? 999) - (b.positionNumber ?? 999))[0] ??
    null
  );
}

export interface RepeatTrajectoryPoint {
  holeNumber: number;
  y2025CumulativeToPar: number;
  y2026CumulativeToPar: number;
}

export interface RepeatHoleDeltaCell {
  roundNumber: 1 | 2 | 3 | 4;
  holeNumber: number;
  holeName: string;
  par: number;
  yardage: number;
  score2025: number;
  score2026: number;
  delta: number;
}

export function getRepeatPathSeries(
  scorecard2025: RoryRepeatScorecardData,
  scorecard2026: ScorecardData
): RepeatTrajectoryPoint[] {
  return Array.from({ length: 72 }, (_, index) => {
    const holeNumber = index + 1;
    return {
      holeNumber,
      y2025CumulativeToPar: scorecard2025.trajectory[index]?.cumulativeToPar ?? 0,
      y2026CumulativeToPar: scorecard2026.trajectory[index]?.cumulativeToPar ?? 0,
    };
  });
}

export function getRepeatHoleDeltaCells(
  scorecard2025: RoryRepeatScorecardData,
  scorecard2026: ScorecardData
): RepeatHoleDeltaCell[] {
  const cells: RepeatHoleDeltaCell[] = [];

  scorecard2026.rounds.forEach((round2026) => {
    const round2025 = scorecard2025.rounds.find((round) => round.roundNumber === round2026.roundNumber);
    if (!round2025) return;

    round2026.holes.forEach((hole2026) => {
      const hole2025 = round2025.holes.find((hole) => hole.holeNumber === hole2026.holeNumber);
      if (!hole2025) return;
      cells.push({
        roundNumber: round2026.roundNumber as 1 | 2 | 3 | 4,
        holeNumber: hole2026.holeNumber,
        holeName: hole2026.holeName ?? hole2025.holeName ?? `Hole ${hole2026.holeNumber}`,
        par: hole2026.par,
        yardage: hole2026.yardage,
        score2025: hole2025.score,
        score2026: hole2026.score,
        delta: hole2026.score - hole2025.score,
      });
    });
  });

  return cells;
}

export function getRepeatHoleDeltaMatrix(
  cells: RepeatHoleDeltaCell[],
  segment: SegmentFilter
): RepeatHoleDeltaCell[] {
  return cells.filter((cell) => matchesSegment(cell, segment));
}

export function getRepeatChampionChartRows(rows: RepeatChampionBenchmarkRow[]) {
  return rows.map((row) => {
    const bestRound = Math.min(...row.repeatWin.rounds);
    const worstRound = Math.max(...row.repeatWin.rounds);
    const repeatDelta = row.repeatWin.scoreToPar - row.firstWin.scoreToPar;

    return {
      ...row,
      championKey: `${row.playerSlug}-${row.repeatYear}`,
      bestRound,
      worstRound,
      repeatDelta,
      firstWinRoundRange: Math.max(...row.firstWin.rounds) - Math.min(...row.firstWin.rounds),
      repeatWinRoundRange: worstRound - bestRound,
    };
  });
}
