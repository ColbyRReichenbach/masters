import { useMemo, useState } from "react";
import {
  getAllPlayerTournamentStatAverages,
  getAllPlayerTournamentStatsMeta,
  getAllPlayerTournamentStats,
  getWinnerProfile,
} from "../lib/data";
import {
  PROFILE_KPI_KEYS,
  PLAYER_METRICS,
  type PlayerMetricKey,
} from "../lib/chart-formatters";
import {
  getAggregateScoringProfile,
  getCohortPlayers,
  getDefaultComparisonPlayer,
  getDerivedWinnerProfile,
  getMetricDistribution,
  getMetricRank,
  getMetricValue,
  getMetricAveragesWithTournamentSource,
  getPlayerPercentile,
  getPlayerScoringProfile,
  getSelectedPlayer,
} from "../lib/selectors";

export type CohortFilter = "all" | "top10";

export function useProfileModel() {
  const rawProfile = getWinnerProfile();
  const players = getAllPlayerTournamentStats();
  const statAverages = getAllPlayerTournamentStatAverages();
  const statsMeta = getAllPlayerTournamentStatsMeta();
  const profile = getDerivedWinnerProfile(rawProfile, players, statAverages);
  const rory = players.find((player) => player.playerSlug === profile.player.slug) ?? players[0];
  const defaultSelected = getDefaultComparisonPlayer(players, profile.player.slug);

  const [cohort, setCohort] = useState<CohortFilter>("all");
  const [distributionMetric, setDistributionMetric] = useState<PlayerMetricKey>("girPct");
  const [scatterXMetric, setScatterXMetricState] = useState<PlayerMetricKey>("girPct");
  const [scatterYMetric, setScatterYMetricState] = useState<PlayerMetricKey>("puttsPerGir");
  const [selectedPlayerSlug, setSelectedPlayerSlug] = useState<string | null>(
    defaultSelected?.playerSlug ?? null
  );

  const cohortPlayers = useMemo(() => getCohortPlayers(players, cohort), [players, cohort]);
  const top10Players = useMemo(() => getCohortPlayers(players, "top10"), [players]);
  const bins = useMemo(
    () => getMetricDistribution(cohortPlayers, distributionMetric, 10),
    [cohortPlayers, distributionMetric]
  );
  const fieldAverages = useMemo(
    () => getMetricAveragesWithTournamentSource(players, statAverages.field),
    [players, statAverages.field]
  );
  const top10Averages = useMemo(
    () => getMetricAveragesWithTournamentSource(top10Players, statAverages.top10),
    [top10Players, statAverages.top10]
  );
  const selectedPlayer = useMemo(
    () => getSelectedPlayer(players, selectedPlayerSlug),
    [players, selectedPlayerSlug]
  );

  const kpis = PROFILE_KPI_KEYS.map((key) => ({
    key,
    config: PLAYER_METRICS[key],
    value: rory ? getMetricValue(rory, key) : null,
    fieldAverage: fieldAverages[key],
    top10Average: top10Averages[key],
    percentile: rory ? getPlayerPercentile(players, key, rory.playerSlug) : null,
    rank: rory ? getMetricRank(players, key, rory.playerSlug) : null,
  }));

  const setScatterXMetric = (metric: PlayerMetricKey) => {
    setScatterXMetricState(metric);
    if (metric === scatterYMetric) {
      setScatterYMetricState(metric === "girPct" ? "puttsPerGir" : "girPct");
    }
  };

  const setScatterYMetric = (metric: PlayerMetricKey) => {
    setScatterYMetricState(metric);
    if (metric === scatterXMetric) {
      setScatterXMetricState(metric === "puttsPerGir" ? "girPct" : "puttsPerGir");
    }
  };

  return {
    profile,
    statsMeta,
    players,
    rory,
    cohort,
    setCohort,
    cohortPlayers,
    top10Players,
    distributionMetric,
    setDistributionMetric,
    bins,
    scatterXMetric,
    scatterYMetric,
    setScatterXMetric,
    setScatterYMetric,
    selectedPlayerSlug,
    setSelectedPlayerSlug,
    selectedPlayer,
    fieldAverages,
    top10Averages,
    kpis,
    roryScoringProfile: getPlayerScoringProfile(rory),
    selectedScoringProfile: getPlayerScoringProfile(selectedPlayer),
    fieldScoringProfile: getAggregateScoringProfile(players),
    top10ScoringProfile: getAggregateScoringProfile(top10Players),
  };
}
