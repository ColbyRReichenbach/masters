import { useMemo, useState } from "react";
import {
  getNarrativeAnnotations,
  getRepeatChampionBenchmarks,
  getRepeatContext,
  getRory2025Scorecard,
  getWinnerScorecard,
} from "../lib/data";
import {
  getRepeatChampionChartRows,
  getRepeatHoleDeltaCells,
  getRepeatHoleDeltaMatrix,
  getRepeatPathSeries,
  type RepeatHoleDeltaCell,
  type RepeatZoom,
} from "../lib/selectors";
import type { SegmentFilter } from "./useTournamentOverviewModel";

export function useRepeatModel() {
  const scorecard2025 = getRory2025Scorecard();
  const scorecard2026 = getWinnerScorecard();
  const repeatContext = getRepeatContext();
  const narratives = getNarrativeAnnotations();
  const benchmarks = getRepeatChampionBenchmarks();

  const [repeatPathZoom, setRepeatPathZoom] = useState<RepeatZoom>("all72");
  const [repeatMatrixSegment, setRepeatMatrixSegment] = useState<SegmentFilter>("all");
  const [selectedRepeatHoleCell, setSelectedRepeatHoleCell] = useState<{
    roundNumber: 1 | 2 | 3 | 4;
    holeNumber: number;
  } | null>(null);
  const [selectedChampionKey, setSelectedChampionKey] = useState<string | null>("rory-mcilroy-2026");

  const repeatPathSeries = useMemo(
    () => getRepeatPathSeries(scorecard2025, scorecard2026),
    [scorecard2025, scorecard2026]
  );
  const allDeltaCells = useMemo(
    () => getRepeatHoleDeltaCells(scorecard2025, scorecard2026),
    [scorecard2025, scorecard2026]
  );
  const visibleDeltaCells = useMemo(
    () => getRepeatHoleDeltaMatrix(allDeltaCells, repeatMatrixSegment),
    [allDeltaCells, repeatMatrixSegment]
  );
  const championRows = useMemo(() => getRepeatChampionChartRows(benchmarks), [benchmarks]);
  const selectedChampion = championRows.find((row) => row.championKey === selectedChampionKey) ?? championRows.at(-1) ?? null;
  const selectedCell =
    allDeltaCells.find(
      (cell) =>
        cell.roundNumber === selectedRepeatHoleCell?.roundNumber &&
        cell.holeNumber === selectedRepeatHoleCell?.holeNumber
    ) ?? null;

  const selectHole72 = (holeNumber72: number) => {
    const roundNumber = Math.ceil(holeNumber72 / 18) as 1 | 2 | 3 | 4;
    const holeNumber = ((holeNumber72 - 1) % 18) + 1;
    setSelectedRepeatHoleCell({ roundNumber, holeNumber });
  };

  const selectCell = (cell: Pick<RepeatHoleDeltaCell, "roundNumber" | "holeNumber">) => {
    setSelectedRepeatHoleCell({ roundNumber: cell.roundNumber, holeNumber: cell.holeNumber });
  };

  return {
    scorecard2025,
    scorecard2026,
    repeatContext,
    narratives,
    repeatPathZoom,
    setRepeatPathZoom,
    repeatMatrixSegment,
    setRepeatMatrixSegment,
    selectedRepeatHoleCell,
    selectedCell,
    setSelectedRepeatHoleCell,
    repeatPathSeries,
    allDeltaCells,
    visibleDeltaCells,
    championRows,
    selectedChampionKey,
    setSelectedChampionKey,
    selectedChampion,
    selectHole72,
    selectCell,
  };
}

