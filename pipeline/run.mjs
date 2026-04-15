import path from "node:path";
import config from "./config.mjs";
import { ensureDir } from "./lib/fs.mjs";
import { createBrowser, fetchStructuredPage } from "./lib/page.mjs";
import { parseLeaderboard, parseEspnScorecardPage } from "./lib/espn.mjs";
import { parseMastersHoleStats } from "./lib/masters.mjs";
import { normalizePositionLabel } from "./lib/aggregate.mjs";
import { validateCourse, validatePlayerScorecard } from "./lib/validate.mjs";
import { buildArtifacts, syncArtifacts, writeArtifacts } from "./lib/build.mjs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mapWithConcurrency(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await task(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  const sync = process.argv.includes('--sync');
  ensureDir(config.output.root);
  ensureDir(config.output.rawDir);
  ensureDir(config.output.generatedDir);

  const browser = await createBrowser(config.espn);
  try {
    console.log('Fetching leaderboard...');
    const leaderboardPage = await fetchStructuredPage(browser, config.tournament.leaderboardUrl, path.join(config.output.rawDir, 'leaderboard'), config.espn.timeoutMs);
    const leaderboard = parseLeaderboard(leaderboardPage).map((row) => ({ ...row, ...normalizePositionLabel(row.positionLabel) }));
    console.log(`Recovered ${leaderboard.length} leaderboard player rows.`);

    console.log('Fetching Masters hole stats...');
    const mastersStatsPage = await fetchStructuredPage(browser, config.tournament.mastersHoleStatsUrl, path.join(config.output.rawDir, 'masters-hole-stats'), config.espn.timeoutMs);
    const holes = parseMastersHoleStats(mastersStatsPage);
    const course = { holes };
    validateCourse(course);

    console.log('Fetching player scorecards from ESPN...');
    const fieldPlayers = (await mapWithConcurrency(leaderboard, config.espn.maxConcurrency, async (row, i) => {
      if (i > 0) await sleep(config.espn.throttleMs);
      console.log(`  [${i + 1}/${leaderboard.length}] ${row.displayName}`);
      const pageData = await fetchStructuredPage(browser, row.scorecardUrl, path.join(config.output.rawDir, 'scorecards'), config.espn.timeoutMs);
      const parsed = parseEspnScorecardPage(pageData, config.tournament.name);
      const player = {
        slug: row.slug,
        displayName: parsed.displayName || row.displayName,
        positionLabel: row.positionLabel,
        positionNumber: row.positionNumber,
        totalStrokes: parsed.totalStrokes,
        totalToPar: parsed.totalToPar,
        totalYardage: parsed.totalYardage,
        rounds: parsed.rounds.map((round) => ({
          ...round,
          holes: round.holes.map((hole) => {
            const meta = holes.find((h) => h.holeNumber === hole.holeNumber);
            return { ...hole, par: meta?.par ?? hole.par };
          })
        })),
        stats: parsed.stats
      };
      validatePlayerScorecard(player, course);
      return player;
    })).filter(Boolean);

    const artifacts = buildArtifacts({ config, course, fieldPlayers });
    writeArtifacts(config, artifacts);
    console.log(`Wrote generated artifacts to ${config.output.generatedDir}`);

    if (sync) {
      syncArtifacts(config);
      console.log(`Synced automated files into: ${config.output.syncTargets.join(', ')}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});
