#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const TOURNAMENT_ID = process.env.ESPN_TOURNAMENT_ID || "401811941";
const LEADERBOARD_URL = `https://www.espn.com/golf/leaderboard/_/tournamentId/${TOURNAMENT_ID}`;
const OUT_DIR = path.resolve(process.env.OUT_DIR || "pipeline/out/generated");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function cleanText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function toNumber(value) {
  const text = cleanText(value).replace(/,/g, "").replace(/%/g, "");
  if (!text || text === "-") return null;
  if (/^e$/i.test(text)) return 0;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

function toScoreToPar(value) {
  const text = cleanText(value);
  if (!text || text === "-") return null;
  if (/^e$/i.test(text)) return 0;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

function parsePosition(positionLabel) {
  const text = cleanText(positionLabel).toUpperCase();
  const match = text.match(/^T?(\d+)$/);
  return match ? Number(match[1]) : null;
}

function slugify(name) {
  return cleanText(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanPlayerName(raw) {
  return cleanText(raw)
    .replace(/^[^\p{L}]+/u, "")
    .replace(/\s{2,}/g, " ");
}

function mean(values) {
  const nums = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (!nums.length) return null;
  return Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(3));
}

function buildSimpleAverages(players) {
  const top10 = players.filter((p) => p.positionNumber !== null && p.positionNumber <= 10);

  const pick = (rows, key) => mean(rows.map((r) => r[key]));

  return {
    field: {
      drivingDistance: pick(players, "drivingDistanceAvgYards"),
      drivingAccuracyPct: pick(players, "drivingAccuracyPct"),
      girPct: pick(players, "girPct"),
      puttsPerGir: pick(players, "puttsPerGir"),
      eagles: pick(players, "eagles"),
      birdies: pick(players, "birdies"),
      pars: pick(players, "pars"),
      bogeys: pick(players, "bogeys"),
      doubles: pick(players, "doubles"),
      scoreToPar: pick(players, "scoreToPar"),
    },
    top10: {
      drivingDistance: pick(top10, "drivingDistanceAvgYards"),
      drivingAccuracyPct: pick(top10, "drivingAccuracyPct"),
      girPct: pick(top10, "girPct"),
      puttsPerGir: pick(top10, "puttsPerGir"),
      eagles: pick(top10, "eagles"),
      birdies: pick(top10, "birdies"),
      pars: pick(top10, "pars"),
      bogeys: pick(top10, "bogeys"),
      doubles: pick(top10, "doubles"),
      scoreToPar: pick(top10, "scoreToPar"),
    },
  };
}

async function clickTab(page, label) {
  const patterns = [
    page.getByRole("button", { name: new RegExp(`^${label}$`, "i") }),
    page.getByRole("link", { name: new RegExp(`^${label}$`, "i") }),
    page.locator(`text=/^${label}$/i`),
  ];

  for (const locator of patterns) {
    const count = await locator.count().catch(() => 0);
    if (!count) continue;

    const target = locator.first();
    if (await target.isVisible().catch(() => false)) {
      await target.click({ timeout: 5000 }).catch(async () => {
        await target.scrollIntoViewIfNeeded().catch(() => { });
        await target.click({ timeout: 5000 });
      });
      await page.waitForTimeout(1500);
      return;
    }
  }

  throw new Error(`Could not click tab: ${label}`);
}

async function extractMatchingTable(page, requiredHeaders) {
  return await page.evaluate((requiredHeadersInner) => {
    const normalize = (s) =>
      String(s || "")
        .replace(/\u00a0/g, " ")
        .replace(/[ \t]+/g, " ")
        .trim()
        .toLowerCase();

    const getRows = (table) =>
      Array.from(table.querySelectorAll("tr")).map((tr) =>
        Array.from(tr.querySelectorAll("th,td")).map((cell) =>
          String(cell.innerText || "")
            .replace(/\u00a0/g, " ")
            .replace(/[ \t]+/g, " ")
            .trim()
        )
      );

    const tables = Array.from(document.querySelectorAll("table"));
    const candidates = tables.map((table) => {
      const rows = getRows(table);
      const headers = (rows[0] || []).map(normalize);
      return { rows, headers };
    });

    const match = candidates.find((candidate) =>
      requiredHeadersInner.every((wanted) =>
        candidate.headers.some((actual) => actual === wanted || actual.includes(wanted))
      )
    );

    return match || null;
  }, requiredHeaders.map((h) => h.toLowerCase()));
}

async function parsePlayerStats(page) {
  await clickTab(page, "Player Stats");

  const table = await extractMatchingTable(page, [
    "pos",
    "player",
    "yds/drv",
    "drv acc",
    "gir",
    "pp gir",
    "eagle",
    "birdie",
    "pars",
    "bogey",
    "dbl",
    "score",
  ]);

  if (!table) {
    throw new Error("Could not find Player Stats table on ESPN leaderboard page.");
  }

  const rows = table.rows
    .slice(1)
    .map((row) => row.map((cell) => cleanText(cell)))
    .filter((row) => row.length >= 12);

  const players = rows.map((row) => {
    // ESPN player rows often include a leading blank expand/caret cell.
    // We want the RIGHTMOST 12 cells, which correspond to:
    // POS, PLAYER, YDS/DRV, DRV ACC, GIR, PP GIR, EAGLE, BIRDIE, PARS, BOGEY, DBL, SCORE
    const cells = row.slice(-12);

    const positionLabel = cleanText(cells[0]);
    const playerName = cleanPlayerName(cells[1]);

    return {
      positionLabel,
      positionNumber: parsePosition(positionLabel),
      playerName,
      playerSlug: slugify(playerName),
      drivingDistanceAvgYards: toNumber(cells[2]),
      drivingAccuracyPct: toNumber(cells[3]),
      girPct: toNumber(cells[4]),
      puttsPerGir: toNumber(cells[5]),
      eagles: toNumber(cells[6]),
      birdies: toNumber(cells[7]),
      pars: toNumber(cells[8]),
      bogeys: toNumber(cells[9]),
      doubles: toNumber(cells[10]),
      scoreToPar: toScoreToPar(cells[11]),
    };
  });

  return {
    tournamentId: TOURNAMENT_ID,
    source: LEADERBOARD_URL,
    pulledAt: new Date().toISOString(),
    playerCount: players.length,
    averages: buildSimpleAverages(players),
    players,
  };
}

async function parseCourseStats(page) {
  await clickTab(page, "Course Stats");

  const table = await extractMatchingTable(page, [
    "hole",
    "par",
    "yards",
    "avg score",
    "eagles",
    "birdies",
    "pars",
    "bogeys",
    "doubles",
    "other",
    "+/- avg",
  ]);

  if (!table) {
    throw new Error("Could not find Course Stats table on ESPN leaderboard page.");
  }

  const rows = table.rows
    .slice(1)
    .map((row) => row.map((cell) => cleanText(cell)))
    .filter((row) => row.length >= 11);

  const holes = rows.map((row) => {
    // Take the RIGHTMOST 11 cells to guard against any leading utility columns
    const cells = row.slice(-11);

    return {
      holeNumber: toNumber(cells[0]),
      par: toNumber(cells[1]),
      yards: toNumber(cells[2]),
      avgScore: toNumber(cells[3]),
      eagles: toNumber(cells[4]),
      birdies: toNumber(cells[5]),
      pars: toNumber(cells[6]),
      bogeys: toNumber(cells[7]),
      doubles: toNumber(cells[8]),
      other: toNumber(cells[9]),
      avgToPar: toNumber(cells[10]),
    };
  });

  return {
    tournamentId: TOURNAMENT_ID,
    source: LEADERBOARD_URL,
    pulledAt: new Date().toISOString(),
    holeCount: holes.length,
    holes,
  };
}

async function main() {
  ensureDir(OUT_DIR);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 1200 },
  });

  try {
    console.log(`Opening ${LEADERBOARD_URL}`);
    await page.goto(LEADERBOARD_URL, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForTimeout(2000);

    const playerStats = await parsePlayerStats(page);
    writeJson(path.join(OUT_DIR, "all_player_tournament_stats.json"), playerStats);
    console.log(`Wrote ${path.join(OUT_DIR, "all_player_tournament_stats.json")}`);

    const courseStats = await parseCourseStats(page);
    writeJson(path.join(OUT_DIR, "course_hole_stats.json"), courseStats);
    console.log(`Wrote ${path.join(OUT_DIR, "course_hole_stats.json")}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
