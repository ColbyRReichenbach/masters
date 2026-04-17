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
  const serializeHole = (hole) => {
    const meta = courseByHole.get(hole.holeNumber);
    return {
      holeNumber: hole.holeNumber,
      holeName: meta?.holeName ?? undefined,
      par: hole.par,
      yardage: meta?.yardage,
      score: hole.score,
      toPar: hole.toPar,
      displayValue: hole.displayValue,
      label: hole.label
    };
  };

  const allPlayerScorecards = {
    tournamentId: config.tournament.tournamentId ?? null,
    year: config.tournament.year,
    name: config.tournament.name,
    venueName: config.tournament.venueName,
    courseInfo: {
      name: config.tournament.venueName,
      totalPar: config.tournament.par,
      totalYardage: winner.totalYardage
    },
    top10Mode: config.tournament.top10Mode,
    playerCount: sortedPlayers.length,
    players: sortedPlayers.map((player) => ({
      playerSlug: player.slug,
      playerName: player.displayName,
      positionLabel: player.positionLabel,
      positionNumber: player.positionNumber,
      totalStrokes: player.totalStrokes,
      totalToPar: player.totalToPar,
      roundsPlayed: player.rounds.length,
      holesPlayed: player.rounds.reduce((sum, round) => sum + round.holes.length, 0),
      madeCut: player.rounds.length >= 4,
      stats: player.stats ?? null,
      rounds: player.rounds.map((round) => ({
        roundNumber: round.roundNumber,
        strokes: round.strokes,
        toPar: round.toPar,
        holes: round.holes.map(serializeHole)
      }))
    })),
    generatedAt: new Date().toISOString()
  };

  const allPlayerTournamentStats = {
    tournamentId: config.tournament.tournamentId ?? null,
    year: config.tournament.year,
    source: config.tournament.leaderboardUrl,
    playerCount: sortedPlayers.length,
    averages: {
      field: Object.fromEntries(
        fieldMetricAverages.map((metric) => [metric.key, metric.average])
      ),
      top10: Object.fromEntries(
        top10MetricAverages.map((metric) => [metric.key, metric.average])
      )
    },
    players: sortedPlayers.map((player) => ({
      positionLabel: player.positionLabel,
      positionNumber: player.positionNumber,
      playerName: player.displayName,
      playerSlug: player.slug,
      drivingDistanceAvgYards: player.stats?.metrics?.drivingDistanceAvgYards ?? null,
      drivingAccuracyPct: player.stats?.metrics?.drivingAccuracyPct ?? null,
      girPct: player.stats?.metrics?.girPct ?? null,
      puttsPerGir: player.stats?.metrics?.puttsPerGir ?? null,
      sandSavePct: player.stats?.metrics?.sandSavePct ?? null,
      eagles: player.stats?.scoringSummary?.eagle ?? null,
      birdies: player.stats?.scoringSummary?.birdie ?? null,
      pars: player.stats?.scoringSummary?.par ?? null,
      bogeys: player.stats?.scoringSummary?.bogey ?? null,
      doubles: player.stats?.scoringSummary?.doubleOrWorse ?? null,
      scoreToPar: player.positionNumber !== null ? player.totalToPar : null
    })),
    generatedAt: new Date().toISOString()
  };

  const courseHoleAggregates = new Map(
    course.holes.map((hole) => [
      hole.holeNumber,
      {
        holeNumber: hole.holeNumber,
        holeName: hole.holeName,
        par: hole.par,
        yards: hole.yardage,
        scoreSum: 0,
        count: 0,
        eagles: 0,
        birdies: 0,
        pars: 0,
        bogeys: 0,
        doubles: 0,
        other: 0
      }
    ])
  );

  for (const player of sortedPlayers) {
    for (const round of player.rounds) {
      for (const hole of round.holes) {
        const row = courseHoleAggregates.get(hole.holeNumber);
        if (!row) continue;
        row.scoreSum += hole.score;
        row.count += 1;
        const diff = hole.score - hole.par;
        if (diff <= -2) row.eagles += 1;
        else if (diff === -1) row.birdies += 1;
        else if (diff === 0) row.pars += 1;
        else if (diff === 1) row.bogeys += 1;
        else if (diff === 2) row.doubles += 1;
        else row.other += 1;
      }
    }
  }

  const courseHoleStats = {
    tournamentId: config.tournament.tournamentId ?? null,
    year: config.tournament.year,
    source: "parsed ESPN player scorecards",
    holeCount: course.holes.length,
    holes: Array.from(courseHoleAggregates.values()).map((row) => {
      const avgScore = row.count
        ? Number((row.scoreSum / row.count).toFixed(3))
        : null;
      return {
        holeNumber: row.holeNumber,
        holeName: row.holeName,
        par: row.par,
        yards: row.yards,
        avgScore,
        eagles: row.eagles,
        birdies: row.birdies,
        pars: row.pars,
        bogeys: row.bogeys,
        doubles: row.doubles,
        other: row.other,
        avgToPar: avgScore == null ? null : Number((avgScore - row.par).toFixed(3))
      };
    }),
    generatedAt: new Date().toISOString()
  };

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
        return {
          ...serializeHole(hole),
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
      allPlayerScorecards: true,
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

  return {
    tournament,
    winnerSummary,
    winnerScorecard,
    winnerProfile,
    allPlayerScorecards,
    allPlayerTournamentStats,
    courseHoleStats,
    methodology
  };
}

export function writeArtifacts(config, artifacts) {
  const outDir = config.output.generatedDir;
  ensureDir(outDir);
  writeJson(path.join(outDir, 'tournament.json'), artifacts.tournament);
  writeJson(path.join(outDir, 'winner.json'), artifacts.winnerSummary);
  writeJson(path.join(outDir, 'winner_scorecard.json'), artifacts.winnerScorecard);
  writeJson(path.join(outDir, 'winner_profile.json'), artifacts.winnerProfile);
  writeJson(path.join(outDir, 'all_player_scorecards.json'), artifacts.allPlayerScorecards);
  writeJson(path.join(outDir, 'all_player_tournament_stats.json'), artifacts.allPlayerTournamentStats);
  writeJson(path.join(outDir, 'course_hole_stats.json'), artifacts.courseHoleStats);
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
