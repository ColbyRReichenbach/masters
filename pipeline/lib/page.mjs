import { chromium } from "playwright";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ensureDir, exists, readJson, writeJson, writeText, urlHash } from "./fs.mjs";

const execFileAsync = promisify(execFile);

function normalizeText(s) {
  return String(s || "")
    .replace(/\u00a0/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripHtml(html) {
  return normalizeText(
    String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<\/(p|div|section|article|tr|li|h1|h2|h3|h4|h5|h6|br)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, "\"")
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
  );
}

function extractLinks(html, baseUrl) {
  const links = [];
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    const text = normalizeText(stripHtml(m[2]));
    try {
      const absolute = new URL(href, baseUrl).href;
      if (absolute) links.push({ href: absolute, text });
    } catch { }
  }
  return links;
}

async function fetchViaCurl(url, timeoutMs = 45000) {
  const maxTimeSeconds = Math.max(15, Math.ceil(timeoutMs / 1000));
  const args = [
    "-L",
    "--http1.1",
    "--compressed",
    "--max-time",
    String(maxTimeSeconds),
    "-A",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    url
  ];

  const { stdout } = await execFileAsync("curl", args, {
    maxBuffer: 20 * 1024 * 1024
  });

  const html = String(stdout || "");
  const text = stripHtml(html);
  const links = extractLinks(html, url);

  return {
    url,
    html,
    text,
    links,
    tables: [],
    rows: [],
    selects: []
  };
}

export async function createBrowser(config) {
  return chromium.launch({ headless: config.headless !== false });
}

export async function fetchStructuredPage(browser, url, cacheDir, timeoutMs = 45000) {
  ensureDir(cacheDir);
  const key = urlHash(url);
  const cacheFile = path.join(cacheDir, `${key}.json`);
  if (exists(cacheFile)) return readJson(cacheFile);

  let payload = null;
  let lastError = null;

  try {
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    });
    page.setDefaultTimeout(timeoutMs);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    payload = await page.evaluate(() => {
      const norm = (s) =>
        String(s || "")
          .replace(/\u00a0/g, " ")
          .replace(/[ \t]+/g, " ")
          .replace(/\n{3,}/g, "\n\n")
          .trim();

      const allRows = Array.from(document.querySelectorAll("tr,[role='row']"))
        .map((row) => {
          const cells = Array.from(
            row.querySelectorAll("th,td,[role='cell'],[role='columnheader']")
          )
            .map((cell) => norm(cell.innerText))
            .filter(Boolean);

          const links = Array.from(row.querySelectorAll("a[href]"))
            .map((a) => ({ text: norm(a.textContent), href: a.href }))
            .filter((a) => a.href);

          return { text: norm(row.innerText), cells, links };
        })
        .filter((r) => r.text);

      const tables = Array.from(document.querySelectorAll("table,[role='table']"))
        .map((table) => {
          const rows = Array.from(table.querySelectorAll("tr,[role='row']"))
            .map((row) =>
              Array.from(
                row.querySelectorAll("th,td,[role='cell'],[role='columnheader']")
              )
                .map((cell) => norm(cell.innerText))
                .filter(Boolean)
            )
            .filter((r) => r.length);
          return { rows };
        })
        .filter((t) => t.rows.length);

      const links = Array.from(document.querySelectorAll("a[href]"))
        .map((a) => ({ text: norm(a.textContent), href: a.href }))
        .filter((a) => a.href);

      const html = document.documentElement.outerHTML;
      const text = norm(document.body.innerText);
      const selects = Array.from(document.querySelectorAll("select")).map(
        (select, idx) => ({
          index: idx,
          options: Array.from(select.options).map((o) => ({
            text: norm(o.textContent),
            value: o.value
          }))
        })
      );

      return { url: location.href, text, html, links, tables, rows: allRows, selects };
    });

    await page.close();
  } catch (error) {
    lastError = error;
  }

  if (!payload) {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    if (hostname === "masters.com") {
      payload = await fetchViaCurl(url, timeoutMs);
    } else {
      throw lastError;
    }
  }

  writeJson(cacheFile, payload);
  writeText(path.join(cacheDir, `${key}.txt`), normalizeText(payload.text));
  return payload;
}