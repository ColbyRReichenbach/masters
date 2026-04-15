import path from "node:path";
import { buildDistribution, buildHoleAverages, buildMetricAverages, buildTrajectory, buildWinnerVerdicts, selectTopGroup } from "./aggregate.mjs";
import { writeJson, copyFile, ensureDir } from "./fs.mjs";

export function buildArtifacts({ config, course, fieldPlayers }) {
  const sortedPlayers = [...fieldPlayers].sort((a, b) => {
    const ar = a.positionNumber ?? 9999;
    const br = b.positionNumber ?? 9999;
    return ar - br || a.displayName.localeCompare(b.displayName);
  });

  const winner = sortedPlayers.find((p) => p.positionNumber === 1) || sortedPlayers[0];
  const topGroup = selectTopGroup(sortedPlayers, config.tournament.top10Mode);
  const fieldHoleAverages = buildHoleAverages(sortedPlayers);
  const top10HoleAverages = buildHoleAverages(topGroup);
  const fieldMetricAverages = buildMetricAverages(sortedPlayers);
  const top10MetricAverages = buildMetricAverages(topGroup);
  const fieldDistribution = buildDistribution(sortedPlayers);
  const winnerDistribution = buildDistribution([winner]);

  const courseByHole = new Map(course.holes.map((h) => [h.holeNumber, h]));
  const winnerScorecard = {
    player: {
      slug: winner.slug,
      displayName: winner.displayName,
      totalToPar: winner.totalToPar,
      totalStrokes: winner.totalStrokes
    },
    courseInfo: {
      name: config.tournament.venueName,
      totalPar: config.tournament.par,
      totalYardage: winner.totalYardage
    },
    rounds: winner.rounds.map((round) => ({
      roundNumber: round.roundNumber,
      strokes: round.strokes,
      toPar: round.toPar,
      holes: round.holes.map((hole) => {
        const meta = courseByHole.get(hole.holeNumber);
        return {
          holeNumber: hole.holeNumber,
          holeName: meta?.holeName ?? undefined,
          par: hole.par,
          yardage: meta?.yardage,
          score: hole.score,
          toPar: hole.toPar,
          displayValue: hole.displayValue,
          label: hole.label,
          fieldAvg: fieldHoleAverages[`${round.roundNumber}:${hole.holeNumber}`] ?? null,
          top10Avg: top10HoleAverages[`${round.roundNumber}:${hole.holeNumber}`] ?? null
        };
      }),
      stats: {
        gir: null,
        putts: null,
        drivingDist: null
      }
    })),
    trajectory: buildTrajectory(winner.rounds, fieldHoleAverages, top10HoleAverages)
  };

  const winnerMetricMap = {
    driving_dist: winner.stats?.metrics?.drivingDistanceAvgYards ?? null,
    fairway_pct: winner.stats?.metrics?.drivingAccuracyPct ?? null,
    gir_pct: winner.stats?.metrics?.girPct ?? null,
    putts_gir: winner.stats?.metrics?.puttsPerGir ?? null,
    sand_save_pct: winner.stats?.metrics?.sandSavePct ?? null
  };
  const fieldMetricMap = Object.fromEntries(fieldMetricAverages.map((m) => [m.key, m.average]));
  const top10MetricMap = Object.fromEntries(top10MetricAverages.map((m) => [m.key, m.average]));

  const metrics = fieldMetricAverages.map((m) => ({
    key: m.key,
    label: m.label,
    winnerValue: winnerMetricMap[m.key],
    fieldValue: fieldMetricMap[m.key],
    top10Value: top10MetricMap[m.key],
    recentChampionMedian: null,
    deltaVsField: winnerMetricMap[m.key] != null && fieldMetricMap[m.key] != null
      ? Number((winnerMetricMap[m.key] - fieldMetricMap[m.key]).toFixed(3))
      : null,
    directionality: m.directionality,
    unit: m.unit
  })).filter((m) => m.winnerValue != null && m.fieldValue != null && m.top10Value != null);

  const winnerProfile = {
    player: {
      slug: winner.slug,
      displayName: winner.displayName
    },
    metrics,
    distributions: winnerDistribution.map((row) => ({
      category: row.category,
      percentage: row.percentage,
      fieldPercentage: fieldDistribution.find((f) => f.category === row.category)?.percentage ?? null
    })),
    verdicts: buildWinnerVerdicts(metrics, fieldMetricAverages)
  };

  const tournament = {
    year: config.tournament.year,
    name: config.tournament.name,
    venueName: config.tournament.venueName,
    courseYardage: winner.totalYardage,
    par: config.tournament.par,
    winnerName: winner.displayName,
    winnerSlug: winner.slug,
    winningScoreToPar: winner.totalToPar,
    fieldSize: sortedPlayers.length,
    generatedAt: new Date().toISOString()
  };

  const winnerSummary = {
    playerSlug: winner.slug,
    displayName: winner.displayName,
    countryCode: "",
    scoreToPar: winner.totalToPar,
    finalPosition: winner.positionNumber ?? 1,
    totalStrokes: winner.totalStrokes,
    rounds: winner.rounds.map((r) => r.strokes),
    keySummaryLine: `${winner.displayName} finished ${winner.totalToPar} with rounds of ${winner.rounds.map((r) => r.strokes).join('-')}.`
  };

  const methodology = {
    sources: {
      leaderboard: config.tournament.leaderboardUrl,
      holeStats: config.tournament.mastersHoleStatsUrl
    },
    generationMode: "automatic_public_web_extraction",
    supported: {
      winnerScorecard: true,
      fieldHoleAverageScores: true,
      top10HoleAverageScores: true,
      fieldTournamentStatAverages: true,
      top10TournamentStatAverages: true,
      scoringDistributions: true
    },
    notSupported: {
      holeLevelFairwayHit: true,
      holeLevelGir: true,
      holeLevelPutts: true,
      holeLevelFieldFairwayPct: true,
      holeLevelFieldGirPct: true,
      holeLevelTop10FairwayPct: true,
      holeLevelTop10GirPct: true,
      autoEditorialNarrative: true
    },
    notes: [
      "All field and top-10 score averages are computed from parsed ESPN player scorecards.",
      "Tournament-level stat averages are computed from parsed ESPN player tournament stat lines.",
      "Unsupported hole-level skill stats are intentionally omitted rather than inferred."
    ],
    generatedAt: new Date().toISOString()
  };

  return { tournament, winnerSummary, winnerScorecard, winnerProfile, methodology };
}

export function writeArtifacts(config, artifacts) {
  const outDir = config.output.generatedDir;
  ensureDir(outDir);
  writeJson(path.join(outDir, 'tournament.json'), artifacts.tournament);
  writeJson(path.join(outDir, 'winner.json'), artifacts.winnerSummary);
  writeJson(path.join(outDir, 'winner_scorecard.json'), artifacts.winnerScorecard);
  writeJson(path.join(outDir, 'winner_profile.json'), artifacts.winnerProfile);
  writeJson(path.join(outDir, 'methodology.json'), artifacts.methodology);
}

export function syncArtifacts(config) {
  for (const targetDir of config.output.syncTargets) {
    ensureDir(targetDir);
    for (const file of config.files.automated) {
      copyFile(path.join(config.output.generatedDir, file), path.join(targetDir, file));
    }
  }
}
