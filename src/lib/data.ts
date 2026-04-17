/* 
 * Frontend data layer that consumes static JSON artifacts bundled at build time.
 * These functions are now synchronous and return data directly from the src/data directory.
 */

import tournamentData from "../data/tournament.json";
import winnerData from "../data/winner.json";
import winnerScorecardData from "../data/winner_scorecard.json";
import winnerProfileData from "../data/winner_profile.json";
import allPlayerScorecardsData from "../data/all_player_scorecards.json";
import allPlayerTournamentStatsData from "../data/all_player_tournament_stats.json";
import courseHoleStatsData from "../data/course_hole_stats.json";
import rory2025ScorecardData from "../data/rory_2025_scorecard.json";
import repeatChampionBenchmarksData from "../data/repeat_champion_benchmarks.json";
import recentChampionsData from "../data/recent_champions.json";
import narrativeAnnotationsData from "../data/narrative_annotations.json";
import repeatContextData from "../data/repeat_context.json";
import roryRepeatComparisonData from "../data/rory_repeat_comparison.json";

/**
 * Tournament Level Data
 */
export interface TournamentData {
  year: number;
  name: string;
  venueName: string;
  courseYardage: number;
  par: number;
  winnerName: string;
  winnerSlug: string;
  winningScoreToPar: number;
  fieldSize: number;
  generatedAt: string;
}

export const getTournament = (): TournamentData => {
  return tournamentData as TournamentData;
};

/**
 * Winner Summary
 */
export interface WinnerData {
  playerSlug: string;
  displayName: string;
  countryCode: string;
  scoreToPar: number;
  finalPosition: number;
  totalStrokes: number;
  rounds: number[];
  keySummaryLine: string;
}

export const getWinner = (): WinnerData => {
  return winnerData as WinnerData;
};

/**
 * Winner Scorecard (Hole-by-Hole & Analysis)
 */
export interface HoleScore {
  holeNumber: number;
  holeName?: string;
  par: number;
  yardage: number;
  score: number;
  toPar: number;
  displayValue: string;
  fieldAvg?: number;
  top10Avg?: number;
  label?: "Eagle" | "Birdie" | "Par" | "Bogey" | "Double+";
}

export interface RoundAnalysis {
  roundNumber: number;
  strokes: number;
  toPar: number;
  holes: HoleScore[];
  stats?: {
    gir: number | null;
    putts: number | null;
    drivingDist: number | null;
  };
}

export interface ScorecardData {
  player: {
    slug: string;
    displayName: string;
    totalToPar: number;
    totalStrokes: number;
  };
  courseInfo: {
    name: string;
    totalPar: number;
    totalYardage: number;
  };
  rounds: RoundAnalysis[];
  trajectory: Array<{
    holeNumber: number;
    cumulativeToPar: number;
    fieldAvgToPar: number;
    top10ToPar: number;
  }>;
}

export const getWinnerScorecard = (): ScorecardData => {
  return winnerScorecardData as unknown as ScorecardData;
};

export interface PlayerScorecard {
  playerSlug: string;
  playerName: string;
  positionLabel: string;
  positionNumber: number | null;
  totalStrokes: number;
  totalToPar: number;
  roundsPlayed: number;
  holesPlayed: number;
  madeCut: boolean;
  stats: {
    metrics: {
      drivingDistanceAvgYards: number | null;
      drivingAccuracyPct: number | null;
      girPct: number | null;
      puttsPerGir: number | null;
      sandSavePct: number | null;
    } | null;
    scoringSummary: {
      eagle: number;
      birdie: number;
      bogey: number;
      par: number;
      doubleOrWorse: number;
    };
  } | null;
  rounds: RoundAnalysis[];
}

export interface AllPlayerScorecardsData {
  tournamentId: string | null;
  year: number;
  name: string;
  venueName: string;
  courseInfo: {
    name: string;
    totalPar: number;
    totalYardage: number;
  };
  top10Mode: string;
  playerCount: number;
  players: PlayerScorecard[];
  generatedAt: string;
}

export const getAllPlayerScorecards = (): AllPlayerScorecardsData => {
  return allPlayerScorecardsData as unknown as AllPlayerScorecardsData;
};

export interface PlayerTournamentStats {
  positionLabel: string;
  positionNumber: number | null;
  playerName: string;
  playerSlug: string;
  drivingDistanceAvgYards: number | null;
  drivingAccuracyPct: number | null;
  girPct: number | null;
  puttsPerGir: number | null;
  sandSavePct?: number | null;
  eagles: number | null;
  birdies: number | null;
  pars: number | null;
  bogeys: number | null;
  doubles: number | null;
  scoreToPar: number | null;
}

export interface TournamentStatAverages {
  field: {
    driving_dist?: number | null;
    fairway_pct?: number | null;
    gir_pct?: number | null;
    putts_gir?: number | null;
    sand_save_pct?: number | null;
  };
  top10: {
    driving_dist?: number | null;
    fairway_pct?: number | null;
    gir_pct?: number | null;
    putts_gir?: number | null;
    sand_save_pct?: number | null;
  };
}

export interface CourseHoleStatsRow {
  holeNumber: number;
  holeName?: string;
  par: number;
  yards: number;
  avgScore: number | null;
  eagles: number;
  birdies: number;
  pars: number;
  bogeys: number;
  doubles: number;
  other: number;
  avgToPar: number | null;
}

export const getAllPlayerTournamentStats = (): PlayerTournamentStats[] => {
  const data = allPlayerTournamentStatsData as { players?: PlayerTournamentStats[] } | PlayerTournamentStats[];
  return Array.isArray(data) ? data : data.players ?? [];
};

export const getAllPlayerTournamentStatAverages = (): TournamentStatAverages => {
  const data = allPlayerTournamentStatsData as { averages?: TournamentStatAverages } | PlayerTournamentStats[];
  return Array.isArray(data)
    ? { field: {}, top10: {} }
    : data.averages ?? { field: {}, top10: {} };
};

export const getAllPlayerTournamentStatsMeta = (): {
  tournamentId: string | null;
  source: string | null;
} => {
  const data = allPlayerTournamentStatsData as
    | { tournamentId?: string | null; source?: string | null }
    | PlayerTournamentStats[];

  return Array.isArray(data)
    ? { tournamentId: null, source: null }
    : {
        tournamentId: data.tournamentId ?? null,
        source: data.source ?? null,
      };
};

export const getCourseHoleStats = (): CourseHoleStatsRow[] => {
  const data = courseHoleStatsData as { holes?: CourseHoleStatsRow[] } | CourseHoleStatsRow[];
  return Array.isArray(data) ? data : data.holes ?? [];
};

export interface RoryRepeatScorecardData {
  tournamentId: string;
  year: number;
  name: string;
  source: string;
  player: ScorecardData["player"];
  courseInfo: ScorecardData["courseInfo"];
  rounds: RoundAnalysis[];
  trajectory: Array<{
    holeNumber: number;
    cumulativeToPar: number;
  }>;
  playoffHoles?: HoleScore[];
  tournamentStats?: Record<string, number | null>;
  generatedAt: string;
}

export const getRory2025Scorecard = (): RoryRepeatScorecardData => {
  return rory2025ScorecardData as unknown as RoryRepeatScorecardData;
};

export interface RepeatChampionWinSummary {
  scoreToPar: number;
  totalStrokes: number;
  rounds: number[];
  winningMargin: string;
  courseYardage: number;
}

export interface RepeatChampionBenchmarkRow {
  playerName: string;
  playerSlug: string;
  firstYear: number;
  repeatYear: number;
  displayLabel: string;
  firstWin: RepeatChampionWinSummary;
  repeatWin: RepeatChampionWinSummary;
  playoffNote: string | null;
  significance: string;
  sources: string[];
}

export const getRepeatChampionBenchmarks = (): RepeatChampionBenchmarkRow[] => {
  return repeatChampionBenchmarksData as RepeatChampionBenchmarkRow[];
};

/**
 * Winner Profile (Metrics & Distributions)
 */
export interface MetricDistribution {
  category: "Birdie+" | "Par" | "Bogey" | "Double+";
  percentage: number;
  fieldPercentage: number;
}

export interface ProfileMetric {
  key: string;
  label: string;
  winnerValue: number;
  fieldValue: number;
  top10Value: number;
  recentChampionMedian: number;
  deltaVsField: number;
  directionality: "higher_better" | "lower_better";
  unit: string;
}

export interface ProfileData {
  player: {
    slug: string;
    displayName: string;
  };
  metrics: ProfileMetric[];
  distributions: MetricDistribution[];
  verdicts: {
    primarySeparator: string;
    secondarySupport: string;
    weaknessOvercome: string;
  };
}

export const getWinnerProfile = (): ProfileData => {
  return winnerProfileData as unknown as ProfileData;
};

/**
 * Recent Champions
 */
export interface RecentChampionsData {
  years: number[];
  metrics: Record<string, Array<{
    year: number;
    playerName: string;
    value: number;
  }>>;
}

export const getRecentChampions = (): RecentChampionsData => {
  return recentChampionsData as RecentChampionsData;
};

/**
 * Narrative Annotations (Primary content)
 */
export interface NarrativeAnnotations {
  homepage: {
    heroDek: string;
    scorecardLead: string;
    bestStretchNote: string;
    repeatHook: string;
  };
  profile: {
    primarySeparator: string;
    secondarySupport: string;
    weaknessOvercome: string;
  };
  repeatContext: {
    introSummary: string;
    rarityDescription: string;
  };
  roryRepeatComparison: {
    where2026ImprovedMost: string;
    where2026RegressedMost: string;
    how2026HeldUpUnderPressure: string;
    overallRepeatVerdict: string;
  };
}

export const getNarrativeAnnotations = (): NarrativeAnnotations => {
  return narrativeAnnotationsData as unknown as NarrativeAnnotations;
};

/**
 * Repeat Analysis Context
 */
export interface RepeatContextData {
  intro: string;
  repeatSetSize: number;
  isRoryInRepeatSet: boolean;
  repeatChampions: Array<{
    playerName: string;
    firstYear: number;
    secondYear: number;
    displayLabel: string;
  }>;
  rarityText: string;
}

export const getRepeatContext = (): RepeatContextData => {
  return repeatContextData as RepeatContextData;
};

/**
 * Rory Repeat Comparison
 */
export interface RoryRepeatComparisonData {
  cumulativeHistory: Array<{
    hole: number;
    score2025: number;
    score2026: number;
  }>;
  roundComparison: Array<{
    round: number;
    value2025: number;
    value2026: number;
    difference: number;
  }>;
  metricComparison: Array<{
    key: string;
    label: string;
    value2025: number;
    value2026: number;
    difference: number;
    directionality: "higher_better" | "lower_better";
  }>;
  takeaways: {
    where2026ImprovedMost: string;
    where2026RegressedMost: string;
    how2026HeldUpUnderPressure: string;
    overallRepeatVerdict: string;
  };
  historicalBenchmarks: Array<{
    player: string;
    years: string;
    score1: number;
    score2: number;
    margin1: string;
    margin2: string;
    significance: string;
  }>;
}

export const getRoryRepeatComparison = (): RoryRepeatComparisonData => {
  return roryRepeatComparisonData as unknown as RoryRepeatComparisonData;
};
