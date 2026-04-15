import { deriveOutcomeCounts } from "./validate.mjs";

export function roundHoleKey(roundNumber, holeNumber) {
  return `${roundNumber}:${holeNumber}`;
}

export function normalizePositionLabel(label) {
  if (!label) return { label: null, positionNumber: null };
  const text = String(label).trim().toUpperCase();
  if (/^T?\d+$/.test(text)) {
    return { label: text, positionNumber: Number(text.replace(/^T/, "")) };
  }
  return { label: text, positionNumber: null };
}

export function selectTopGroup(players, mode = "position_lte_10") {
  if (mode === "first_10_rows") return players.slice(0, 10);
  return players.filter((p) => p.positionNumber !== null && p.positionNumber <= 10);
}

export function buildHoleAverages(players) {
  const sums = new Map();
  const counts = new Map();

  for (const player of players) {
    for (const round of player.rounds) {
      for (const hole of round.holes) {
        const key = roundHoleKey(round.roundNumber, hole.holeNumber);
        sums.set(key, (sums.get(key) || 0) + hole.score);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
  }

  const out = {};
  for (const [key, sum] of sums.entries()) {
    out[key] = Number((sum / counts.get(key)).toFixed(3));
  }
  return out;
}

function roundsPlayed(player) {
  return player?.rounds?.length || 0;
}

function holesPlayed(player) {
  return (player?.rounds || []).reduce((sum, round) => sum + round.holes.length, 0);
}

function fairwayOpportunities(player) {
  return (player?.rounds || []).reduce(
    (sum, round) => sum + round.holes.filter((hole) => hole.par !== 3).length,
    0
  );
}

function weightedMean(entries) {
  let weightedSum = 0;
  let weightSum = 0;

  for (const entry of entries) {
    if (
      entry &&
      typeof entry.value === "number" &&
      Number.isFinite(entry.value) &&
      typeof entry.weight === "number" &&
      Number.isFinite(entry.weight) &&
      entry.weight > 0
    ) {
      weightedSum += entry.value * entry.weight;
      weightSum += entry.weight;
    }
  }

  return weightSum > 0 ? Number((weightedSum / weightSum).toFixed(3)) : null;
}

function weightedPercentage(entries) {
  let numerator = 0;
  let denominator = 0;

  for (const entry of entries) {
    if (
      entry &&
      typeof entry.pct === "number" &&
      Number.isFinite(entry.pct) &&
      typeof entry.base === "number" &&
      Number.isFinite(entry.base) &&
      entry.base > 0
    ) {
      numerator += (entry.pct / 100) * entry.base;
      denominator += entry.base;
    }
  }

  return denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(3)) : null;
}

export function buildMetricAverages(players) {
  const drivingDistance = weightedMean(
    players.map((player) => ({
      value: player.stats?.metrics?.drivingDistanceAvgYards,
      weight: roundsPlayed(player)
    }))
  );

  const drivingAccuracy = weightedPercentage(
    players.map((player) => ({
      pct: player.stats?.metrics?.drivingAccuracyPct,
      base: fairwayOpportunities(player)
    }))
  );

  const gir = weightedPercentage(
    players.map((player) => ({
      pct: player.stats?.metrics?.girPct,
      base: holesPlayed(player)
    }))
  );

  const puttsPerGir = weightedMean(
    players.map((player) => {
      const girPct = player.stats?.metrics?.girPct;
      const ppGir = player.stats?.metrics?.puttsPerGir;
      const base = holesPlayed(player);

      if (
        typeof girPct !== "number" ||
        !Number.isFinite(girPct) ||
        typeof ppGir !== "number" ||
        !Number.isFinite(ppGir) ||
        base <= 0
      ) {
        return null;
      }

      const estimatedGirMade = (girPct / 100) * base;
      return {
        value: ppGir,
        weight: estimatedGirMade
      };
    })
  );

  const sandSaves = weightedMean(
    players.map((player) => ({
      value: player.stats?.metrics?.sandSavePct,
      weight: roundsPlayed(player)
    }))
  );

  return [
    {
      key: "driving_dist",
      label: "Driving Distance",
      directionality: "higher_better",
      unit: "yds",
      average: drivingDistance,
      method: "rounds_weighted_mean_approx"
    },
    {
      key: "fairway_pct",
      label: "Fairway Accuracy",
      directionality: "higher_better",
      unit: "%",
      average: drivingAccuracy,
      method: "opportunity_weighted_pct"
    },
    {
      key: "gir_pct",
      label: "Greens in Regulation",
      directionality: "higher_better",
      unit: "%",
      average: gir,
      method: "holes_played_weighted_pct"
    },
    {
      key: "putts_gir",
      label: "Putts per GIR",
      directionality: "lower_better",
      unit: "avg",
      average: puttsPerGir,
      method: "estimated_gir_weighted_mean"
    },
    {
      key: "sand_save_pct",
      label: "Sand Saves",
      directionality: "higher_better",
      unit: "%",
      average: sandSaves,
      method: "rounds_weighted_mean_approx"
    }
  ];
}

export function buildDistribution(players) {
  let totalHoles = 0;
  const counts = { birdiePlus: 0, par: 0, bogey: 0, doublePlus: 0 };

  for (const player of players) {
    const c = deriveOutcomeCounts(player.rounds);
    counts.birdiePlus += c.birdiePlus;
    counts.par += c.par;
    counts.bogey += c.bogey;
    counts.doublePlus += c.doublePlus;
    totalHoles += player.rounds.reduce((sum, r) => sum + r.holes.length, 0);
  }

  const pct = (n) =>
    totalHoles ? Number(((n / totalHoles) * 100).toFixed(1)) : null;

  return [
    { category: "Birdie+", percentage: pct(counts.birdiePlus) },
    { category: "Par", percentage: pct(counts.par) },
    { category: "Bogey", percentage: pct(counts.bogey) },
    { category: "Double+", percentage: pct(counts.doublePlus) }
  ];
}

export function buildTrajectory(rounds, fieldHoleAverages, top10HoleAverages) {
  const trajectory = [];
  let cumulativeWinner = 0;
  let cumulativeField = 0;
  let cumulativeTop10 = 0;

  for (const round of rounds) {
    for (const hole of round.holes) {
      const key = roundHoleKey(round.roundNumber, hole.holeNumber);
      cumulativeWinner += hole.score - hole.par;
      cumulativeField += (fieldHoleAverages[key] ?? hole.par) - hole.par;
      cumulativeTop10 += (top10HoleAverages[key] ?? hole.par) - hole.par;

      trajectory.push({
        holeNumber: (round.roundNumber - 1) * 18 + hole.holeNumber,
        cumulativeToPar: Number(cumulativeWinner.toFixed(3)),
        fieldAvgToPar: Number(cumulativeField.toFixed(3)),
        top10ToPar: Number(cumulativeTop10.toFixed(3))
      });
    }
  }

  return trajectory;
}

export function buildWinnerVerdicts(winnerMetrics, fieldMetrics) {
  const byKey = Object.fromEntries(winnerMetrics.map((m) => [m.key, m]));
  const fieldByKey = Object.fromEntries(fieldMetrics.map((m) => [m.key, m]));

  const dd = byKey.driving_dist?.winnerValue;
  const ddField = fieldByKey.driving_dist?.average;
  const gir = byKey.gir_pct?.winnerValue;
  const girField = fieldByKey.gir_pct?.average;
  const putts = byKey.putts_gir?.winnerValue;
  const puttsField = fieldByKey.putts_gir?.average;

  return {
    primarySeparator:
      dd != null && ddField != null
        ? `He averaged ${dd} yards per drive against a field average of ${ddField}.`
        : "",
    secondarySupport:
      gir != null && girField != null
        ? `He hit ${gir}% of greens in regulation against a field average of ${girField}%.`
        : "",
    weaknessOvercome:
      putts != null && puttsField != null
        ? `He averaged ${putts} putts per GIR versus a field average of ${puttsField}.`
        : ""
  };
}
