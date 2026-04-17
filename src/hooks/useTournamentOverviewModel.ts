import { useMemo, useState } from "react";
import {
  getNarrativeAnnotations,
  getAllPlayerTournamentStats,
  getAllPlayerTournamentStatAverages,
  getTournament,
  getWinner,
  getWinnerProfile,
  getWinnerScorecard,
} from "../lib/data";
import {
  getHoleByRoundAndNumber,
  getHoleComparison,
  getHoleGainLossSeries,
  getDerivedWinnerProfile,
  getRoryHoleTournamentAverage,
  getRound,
  getTournamentHoleDifficulty,
  getTrajectoryPoint,
} from "../lib/selectors";

export type HomeBenchmark = "field" | "top10";
export type HoleDrawerFocus = "rory" | "vsField" | "vsTop10";
export type RoundFilter = 1 | 2 | 3 | 4;
export type SegmentFilter = "all" | "front9" | "back9" | "par3" | "par4" | "par5";
export type CumulativeZoom = "all72" | "front36" | "back36";

export function useTournamentOverviewModel() {
  const scorecard = getWinnerScorecard();
  const winner = getWinner();
  const tournament = getTournament();
  const narratives = getNarrativeAnnotations();
  const profile = getDerivedWinnerProfile(
    getWinnerProfile(),
    getAllPlayerTournamentStats(),
    getAllPlayerTournamentStatAverages()
  );

  const [selectedRound, setSelectedRound] = useState<RoundFilter>(1);
  const [showFieldAvg, setShowFieldAvg] = useState(false);
  const [showTop10Avg, setShowTop10Avg] = useState(false);
  const [selectedHole, setSelectedHole] = useState<number | null>(null);
  const [holeDrawerFocus, setHoleDrawerFocus] = useState<HoleDrawerFocus>("rory");
  const [holeGainLossBenchmark, setHoleGainLossBenchmark] = useState<HomeBenchmark>("field");
  const [holeGainLossRoundFilter, setHoleGainLossRoundFilter] = useState<"all" | RoundFilter>("all");
  const [holeGainLossSegmentFilter, setHoleGainLossSegmentFilter] = useState<SegmentFilter>("all");
  const [cumulativeZoom, setCumulativeZoom] = useState<CumulativeZoom>("all72");

  const selectedRoundData = useMemo(() => getRound(scorecard, selectedRound), [scorecard, selectedRound]);
  const selectedHoleData = useMemo(() => {
    if (!selectedHole) return null;
    return getHoleByRoundAndNumber(scorecard, selectedRound, selectedHole);
  }, [scorecard, selectedRound, selectedHole]);

  const holeDifficulty = useMemo(() => getTournamentHoleDifficulty(scorecard), [scorecard]);
  const roryTournamentAverage = useMemo(() => {
    if (!selectedHole) return null;
    return getRoryHoleTournamentAverage(scorecard, selectedHole);
  }, [scorecard, selectedHole]);
  const comparison = useMemo(() => (selectedHoleData ? getHoleComparison(selectedHoleData) : null), [selectedHoleData]);
  const trajectoryPoint = useMemo(() => {
    if (!selectedHole) return null;
    return getTrajectoryPoint(scorecard.trajectory, selectedRound, selectedHole);
  }, [scorecard.trajectory, selectedRound, selectedHole]);
  const holeGainLossSeries = useMemo(
    () =>
      getHoleGainLossSeries(
        scorecard,
        holeGainLossBenchmark,
        holeGainLossRoundFilter,
        holeGainLossSegmentFilter
      ),
    [scorecard, holeGainLossBenchmark, holeGainLossRoundFilter, holeGainLossSegmentFilter]
  );

  const openHoleDrawer = (holeNumber: number, focus: HoleDrawerFocus, roundNumber = selectedRound) => {
    setSelectedRound(roundNumber);
    setSelectedHole(holeNumber);
    setHoleDrawerFocus(focus);
  };

  const openFromHole72 = (holeNumber72: number) => {
    const roundNumber = Math.ceil(holeNumber72 / 18) as RoundFilter;
    const holeNumber = ((holeNumber72 - 1) % 18) + 1;
    openHoleDrawer(holeNumber, "rory", roundNumber);
  };

  return {
    scorecard,
    winner,
    tournament,
    narratives,
    profile,
    selectedRound,
    setSelectedRound,
    showFieldAvg,
    setShowFieldAvg,
    showTop10Avg,
    setShowTop10Avg,
    selectedHole,
    selectedRoundData,
    selectedHoleData,
    holeDifficultyRank: selectedHole ? holeDifficulty[selectedHole] ?? null : null,
    roryTournamentAverage,
    comparison,
    trajectoryPoint,
    holeDrawerFocus,
    setHoleDrawerFocus,
    holeGainLossBenchmark,
    setHoleGainLossBenchmark,
    holeGainLossRoundFilter,
    setHoleGainLossRoundFilter,
    holeGainLossSegmentFilter,
    setHoleGainLossSegmentFilter,
    cumulativeZoom,
    setCumulativeZoom,
    holeGainLossSeries,
    openHoleDrawer,
    openFromHole72,
    closeHoleDrawer: () => setSelectedHole(null),
  };
}
