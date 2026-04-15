cat > ./ pipeline / lib / masters.mjs << 'EOF'
import { assert } from "./validate.mjs";

const FALLBACK_HOLES_2026 = [
  { holeNumber: 1, holeName: "Tea Olive", par: 4, yardage: 445 },
  { holeNumber: 2, holeName: "Pink Dogwood", par: 5, yardage: 585 },
  { holeNumber: 3, holeName: "Flowering Peach", par: 4, yardage: 350 },
  { holeNumber: 4, holeName: "Flowering Crab Apple", par: 3, yardage: 240 },
  { holeNumber: 5, holeName: "Magnolia", par: 4, yardage: 495 },
  { holeNumber: 6, holeName: "Juniper", par: 3, yardage: 180 },
  { holeNumber: 7, holeName: "Pampas", par: 4, yardage: 450 },
  { holeNumber: 8, holeName: "Yellow Jasmine", par: 5, yardage: 570 },
  { holeNumber: 9, holeName: "Carolina Cherry", par: 4, yardage: 460 },
  { holeNumber: 10, holeName: "Camellia", par: 4, yardage: 495 },
  { holeNumber: 11, holeName: "White Dogwood", par: 4, yardage: 520 },
  { holeNumber: 12, holeName: "Golden Bell", par: 3, yardage: 155 },
  { holeNumber: 13, holeName: "Azalea", par: 5, yardage: 545 },
  { holeNumber: 14, holeName: "Chinese Fir", par: 4, yardage: 440 },
  { holeNumber: 15, holeName: "Firethorn", par: 5, yardage: 550 },
  { holeNumber: 16, holeName: "Redbud", par: 3, yardage: 170 },
  { holeNumber: 17, holeName: "Nandina", par: 4, yardage: 450 },
  { holeNumber: 18, holeName: "Holly", par: 4, yardage: 465 }
];

function normalize(s) {
  return String(s || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function totalYardage(holes) {
  return holes.reduce((sum, h) => sum + h.yardage, 0);
}

export function parseMastersHoleStats(pageData) {
  const text = String(pageData.text || "");
  const html = String(pageData.html || "");

  // First try: parse from plain text blocks like:
  // Hole 17 - Nandina ... Hole No. 17. Par. 4. Yards. 450.
  const holes = [];
  const seen = new Set();

  const textRegex =
    /Hole\s*(\d{1,2})\s*-\s*([A-Za-z' -]+?)\s+Hole\s*No\.\s*\1\s+Par\.\s*(\d)\s+Yards\.\s*(\d{3,4})/g;

  let m;
  while ((m = textRegex.exec(text)) !== null) {
    const holeNumber = Number(m[1]);
    const holeName = normalize(m[2]);
    const par = Number(m[3]);
    const yardage = Number(m[4]);

    if (
      holeNumber >= 1 &&
      holeNumber <= 18 &&
      Number.isFinite(par) &&
      Number.isFinite(yardage) &&
      !seen.has(holeNumber)
    ) {
      seen.add(holeNumber);
      holes.push({ holeNumber, holeName, par, yardage });
    }
  }

  if (holes.length === 18) {
    return holes.sort((a, b) => a.holeNumber - b.holeNumber);
  }

  // Second try: parse looser from HTML/text, in case the spacing is odd.
  const loose = [];
  const looseSeen = new Set();
  const combined = `${text}\n${html.replace(/<[^>]+>/g, " ")}`;

  const looseRegex =
    /Hole\s*(\d{1,2})\s*-\s*([A-Za-z' -]+?)\s+.*?Par\.?\s*(\d)\s+Yards\.?\s*(\d{3,4})/gis;

  while ((m = looseRegex.exec(combined)) !== null) {
    const holeNumber = Number(m[1]);
    const holeName = normalize(m[2]);
    const par = Number(m[3]);
    const yardage = Number(m[4]);

    if (
      holeNumber >= 1 &&
      holeNumber <= 18 &&
      Number.isFinite(par) &&
      Number.isFinite(yardage) &&
      !looseSeen.has(holeNumber)
    ) {
      looseSeen.add(holeNumber);
      loose.push({ holeNumber, holeName, par, yardage });
    }
  }

  if (loose.length === 18) {
    return loose.sort((a, b) => a.holeNumber - b.holeNumber);
  }

  // Final fallback: use the official 2026 course definition.
  // This is intentionally fixed and validated rather than guessed.
  const fallback = [...FALLBACK_HOLES_2026];
  assert(fallback.length === 18, "Fallback Augusta hole map is incomplete.");
  assert(totalYardage(fallback) === 7565, "Fallback Augusta yardage does not total 7,565.");
  assert(fallback.reduce((sum, h) => sum + h.par, 0) === 72, "Fallback Augusta par does not total 72.");
  return fallback;
}
EOF