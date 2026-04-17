export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function almostEqual(a, b, tolerance = 0.02) {
  return Math.abs(Number(a) - Number(b)) <= tolerance;
}

export function validateCourse(course) {
  assert(course.holes.length === 18, `Expected 18 holes, got ${course.holes.length}.`);
  for (const hole of course.holes) {
    assert(Number.isInteger(hole.holeNumber) && hole.holeNumber >= 1 && hole.holeNumber <= 18, `Invalid hole number: ${hole.holeNumber}`);
    assert(Number.isFinite(hole.par) && hole.par > 0, `Hole ${hole.holeNumber} par must be positive.`);
    assert(Number.isFinite(hole.yardage) && hole.yardage > 0, `Hole ${hole.holeNumber} yardage must be positive.`);
  }
}

export function validatePlayerScorecard(player, course) {
  assert(player.rounds.length >= 1 && player.rounds.length <= 4, `${player.displayName}: unexpected round count ${player.rounds.length}`);
  const totalFromRounds = player.rounds.reduce((sum, round) => sum + round.strokes, 0);
  assert(totalFromRounds === player.totalStrokes, `${player.displayName}: round sum ${totalFromRounds} != total ${player.totalStrokes}`);

  let cumulativeToPar = 0;
  for (const round of player.rounds) {
    assert(round.holes.length === 18, `${player.displayName} round ${round.roundNumber}: expected 18 holes.`);
    const scoreSum = round.holes.reduce((sum, hole) => sum + hole.score, 0);
    assert(scoreSum === round.strokes, `${player.displayName} round ${round.roundNumber}: hole sum ${scoreSum} != strokes ${round.strokes}`);
    const parSum = round.holes.reduce((sum, hole) => sum + hole.par, 0);
    const toPar = scoreSum - parSum;
    assert(toPar === round.toPar, `${player.displayName} round ${round.roundNumber}: toPar mismatch ${toPar} != ${round.toPar}`);
    cumulativeToPar += toPar;
  }
  assert(cumulativeToPar === player.totalToPar, `${player.displayName}: tournament toPar mismatch ${cumulativeToPar} != ${player.totalToPar}`);

  if (player.stats) {
    const counts = deriveOutcomeCounts(player.rounds);
    if (player.stats.scoringSummary) {
      const s = player.stats.scoringSummary;
      assert(counts.birdiePlus === s.eagle + s.birdie, `${player.displayName}: birdie+ mismatch with scoring summary.`);
      assert(counts.bogey === s.bogey, `${player.displayName}: bogey mismatch with scoring summary.`);
      assert(counts.doublePlus === s.doubleOrWorse, `${player.displayName}: double+ mismatch with scoring summary.`);
      assert(counts.par === s.par, `${player.displayName}: par mismatch with scoring summary.`);
    }
  }
}

export function deriveOutcomeCounts(rounds) {
  const counts = { birdiePlus: 0, par: 0, bogey: 0, doublePlus: 0 };
  for (const round of rounds) {
    for (const hole of round.holes) {
      const diff = hole.score - hole.par;
      if (diff <= -1) counts.birdiePlus += 1;
      else if (diff === 0) counts.par += 1;
      else if (diff === 1) counts.bogey += 1;
      else counts.doublePlus += 1;
    }
  }
  return counts;
}
