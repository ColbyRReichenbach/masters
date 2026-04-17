import { slugify } from "./fs.mjs";
import { assert } from "./validate.mjs";

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseNumber(text) {
  if (text == null) return null;
  const raw = String(text).replace(/,/g, "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parsePercent(text) {
  if (text == null) return null;
  return parseNumber(String(text).replace(/%/g, ""));
}

function labelFromDiff(diff) {
  if (diff <= -2) return "Eagle";
  if (diff === -1) return "Birdie";
  if (diff === 0) return "Par";
  if (diff === 1) return "Bogey";
  return "Double+";
}

function deriveDetailedOutcomeCounts(rounds) {
  const counts = {
    eagle: 0,
    birdie: 0,
    par: 0,
    bogey: 0,
    doubleOrWorse: 0
  };

  for (const round of rounds) {
    for (const hole of round.holes) {
      const diff = hole.score - hole.par;
      if (diff <= -2) counts.eagle += 1;
      else if (diff === -1) counts.birdie += 1;
      else if (diff === 0) counts.par += 1;
      else if (diff === 1) counts.bogey += 1;
      else counts.doubleOrWorse += 1;
    }
  }

  return counts;
}

function parseRoundRowsFromText(text) {
  const rounds = [];

  const scorecardRoundRegex =
    /Round\s+([1-4])\s+Hole\s+1\s+2\s+3\s+4\s+5\s+6\s+7\s+8\s+9\s+Out\s+10\s+11\s+12\s+13\s+14\s+15\s+16\s+17\s+18\s+In\s+Tot\s+Par\s+([0-9\s]+?)\s+Score\s+([0-9\s]+?)(?=\s+(?:Eagle|Birdie|Bogey|Dbl bogey or more|Round\s+[1-4]|Latest Videos|Golf News|ESPN|$))/gis;

  let match;
  while ((match = scorecardRoundRegex.exec(text)) !== null) {
    const roundNumber = Number(match[1]);
    const parValues = match[2].trim().split(/\s+/).map(Number);
    const scoreValues = match[3].trim().split(/\s+/).map(Number);

    if (parValues.length < 21 || scoreValues.length < 21) continue;

    const holePars = parValues.slice(0, 9).concat(parValues.slice(10, 19));
    const holeScores = scoreValues.slice(0, 9).concat(scoreValues.slice(10, 19));
    const strokes = scoreValues[20];
    const toPar = strokes - holePars.reduce((a, b) => a + b, 0);

    const holes = holeScores.map((score, i) => {
      const par = holePars[i];
      const diff = score - par;
      return {
        holeNumber: i + 1,
        par,
        score,
        toPar: diff,
        displayValue: String(score),
        label: labelFromDiff(diff)
      };
    });

    rounds.push({ roundNumber, strokes, toPar, holes });
  }

  return rounds.sort((a, b) => a.roundNumber - b.roundNumber);
}

function extractTournamentId(url) {
  const text = String(url || "");
  return (
    text.match(/\/tournamentId\/(\d+)/i)?.[1] ||
    text.match(/[?&]tournamentId=(\d+)/i)?.[1] ||
    null
  );
}

export function deriveScorecardUrl(href, tournamentId = null) {
  if (!href) return null;
  let scorecardUrl = null;
  if (href.includes("/golf/player/scorecards/")) scorecardUrl = href;
  if (href.includes("/golf/player/_/id/")) {
    scorecardUrl = href.replace("/golf/player/_/id/", "/golf/player/scorecards/_/id/");
  }

  if (!scorecardUrl) return null;
  if (!tournamentId || /(?:\/tournamentId\/|[?&]tournamentId=)\d+/i.test(scorecardUrl)) {
    return scorecardUrl;
  }

  const separator = scorecardUrl.includes("?") ? "&" : "?";
  return `${scorecardUrl}${separator}tournamentId=${tournamentId}`;
}

export function parseLeaderboard(pageData) {
  const players = [];
  const tournamentId = extractTournamentId(pageData.url);
  for (const row of pageData.rows) {
    const cells = row.cells.filter(Boolean);
    if (!cells.length) continue;

    const pos = cells.find((c) => /^(T?\d+|CUT|WD|DQ)$/i.test(c));
    if (!pos) continue;

    const link = row.links.find((l) => /\/golf\/player\//.test(l.href));
    if (!link) continue;

    const scorecardUrl = deriveScorecardUrl(link.href, tournamentId);
    if (!scorecardUrl) continue;

    const playerName = link.text || cells[1] || row.text;
    const normalizedPosition = /^(T?\d+)$/i.test(pos)
      ? Number(pos.replace(/^T/i, ""))
      : null;

    players.push({
      positionLabel: pos.toUpperCase(),
      positionNumber: normalizedPosition,
      displayName: playerName,
      playerUrl: link.href,
      scorecardUrl,
      slug: playerName ? slugify(playerName) : null
    });
  }

  const deduped = [];
  const seen = new Set();
  for (const player of players) {
    const key = `${player.displayName}|${player.scorecardUrl}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(player);
  }

  assert(
    deduped.length >= 20,
    `Could not recover enough leaderboard rows from ESPN. Recovered ${deduped.length}.`
  );

  return deduped;
}

export function parseEspnScorecardPage(pageData, wantedEventName) {
  const text = normalizeText(pageData.text);
  const compact = text.replace(/\n+/g, " ");

  const eventRegex = wantedEventName
    ? new RegExp(`\\b${escapeRegex(wantedEventName)}\\b`, "i")
    : null;

  const hasRounds =
    /\bRound\s+1\b/i.test(text) &&
    /\bRound\s+2\b/i.test(text);

  const hasScorecardShape =
    /\bHole\s+1\s+2\s+3\s+4\s+5\s+6\s+7\s+8\s+9\s+Out/i.test(text) &&
    /\bPar\s+\d+\s+\d+\s+\d+/i.test(text) &&
    /\bScore\s+\d+\s+\d+\s+\d+/i.test(text);

  const hasTournamentStats =
    /\bTournament Stats\b/i.test(text) ||
    /\bYDS\/DRV\b/i.test(text) ||
    /\bDRV ACC\b/i.test(text) ||
    /\bPP GIR\b/i.test(text);

  assert(
    (eventRegex && eventRegex.test(text)) || (hasRounds && hasScorecardShape),
    "Could not locate recognizable ESPN scorecard content on page."
  );

  const playerName =
    pageData.rows.find((row) => row.links?.some((l) => /\/golf\/player\//.test(l.href)))
      ?.links?.find((l) => /\/golf\/player\//.test(l.href))?.text ||
    null;

  const venueMatch = compact.match(
    /([A-Za-z0-9 .&'\-]+ - [A-Za-z .]+, [A-Z]{2})\s+Par\s+(\d+)\s+Yards\s+(\d+)/i
  );

  const venueName = venueMatch ? venueMatch[1].trim() : null;
  const coursePar = venueMatch ? Number(venueMatch[2]) : null;
  const totalYardage = venueMatch ? Number(venueMatch[3]) : null;

  let statsMatch = compact.match(
    /Tournament Stats\s+YDS\/DRV\s+DRV ACC\s+GIR\s+PP GIR\s+SAVES\s+EAGLE\s+BIRDIE\s+BOGEY\s+([0-9.]+)\s+([0-9.]+)%\s+([0-9.]+)%\s+([0-9.]+)\s+([0-9.]+)%\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)/i
  );

  if (!statsMatch && hasTournamentStats) {
    statsMatch = compact.match(
      /YDS\/DRV\s+DRV ACC\s+GIR\s+PP GIR\s+SAVES\s+EAGLE\s+BIRDIE\s+BOGEY\s+([0-9.]+)\s+([0-9.]+)%\s+([0-9.]+)%\s+([0-9.]+)\s+([0-9.]+)%\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)/i
    );
  }

  const metrics = statsMatch
    ? {
        drivingDistanceAvgYards: parseNumber(statsMatch[1]),
        drivingAccuracyPct: parsePercent(statsMatch[2]),
        girPct: parsePercent(statsMatch[3]),
        puttsPerGir: parseNumber(statsMatch[4]),
        sandSavePct: parsePercent(statsMatch[5])
      }
    : null;

  const posMatch = compact.match(/\bPos\s+([A-Z0-9]+(?:\s*\([^\)]*\))?)/i);

  const rounds = parseRoundRowsFromText(text);

  assert(
    rounds.length >= 2,
    `Expected at least 2 rounds on scorecard page; got ${rounds.length}. Player: ${playerName || "unknown"}`
  );

  const totalStrokes = rounds.reduce((sum, round) => sum + round.strokes, 0);
  const totalToPar = rounds.reduce((sum, round) => sum + round.toPar, 0);

  const exactCounts = deriveDetailedOutcomeCounts(rounds);
  const scoringSummary = {
    eagle: exactCounts.eagle,
    birdie: exactCounts.birdie,
    bogey: exactCounts.bogey,
    par: exactCounts.par,
    doubleOrWorse: exactCounts.doubleOrWorse
  };

  return {
    displayName: playerName,
    venueName,
    coursePar,
    totalYardage,
    rounds,
    totalStrokes,
    totalToPar,
    positionLabel: posMatch ? posMatch[1].replace(/\s*\([^)]*\)/, "").trim() : null,
    stats: { metrics, scoringSummary }
  };
}
