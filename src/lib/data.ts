/* 
 * Frontend data layer that consumes static JSON artifacts bundled at build time.
 * These functions are now synchronous and return data directly from the src/data directory.
 */

import tournamentData from "../data/tournament.json";
import winnerData from "../data/winner.json";
import winnerScorecardData from "../data/winner_scorecard.json";
import winnerProfileData from "../data/winner_profile.json";
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
  stats: {
    gir: number;
    putts: number;
    drivingDist: number;
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
  }>;
}

export const getWinnerScorecard = (): ScorecardData => {
  return winnerScorecardData as unknown as ScorecardData;
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
