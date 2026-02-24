#!/usr/bin/env node
/**
 * Fetches Quran data from fawazahmed0/quran-api and bundles it for offline use.
 *
 * Downloads:
 * 1. Arabic Uthmani Hafs text (all 114 surahs)
 * 2. English Sahih International translation
 * 3. Complete page-to-verse mapping from info.json
 *
 * Outputs:
 * - src/data/quran-arabic.json   (Arabic text by surah)
 * - src/data/quran-english.json  (English translation by surah)
 * - src/data/quran-pages.json    (page -> [{chapter, verse}] mapping)
 * - src/data/quran-meta.json     (chapter metadata with page/juz/hizb info per verse)
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, "..", "src", "data");

const API_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1";

async function fetchJSON(url) {
  console.log(`  Fetching: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

async function main() {
  console.log("Fetching Quran data from fawazahmed0/quran-api...\n");

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  // 1. Fetch info.json for complete metadata (page, juz, hizb, etc. per verse)
  console.log("[1/3] Fetching info.json (verse metadata)...");
  const info = await fetchJSON(`${API_BASE}/info.json`);

  // Build page mapping from info
  // info.chapters is an array of chapter objects, each with verses array
  // Each verse has: { verse, line, juz, manzil, page, ruku, maqra, sajda }
  const pageMap = {}; // page number -> [{chapter, verse}]
  const verseMeta = {}; // "chapter:verse" -> {page, juz, hizb, ruku, sajda, line}

  for (const chapter of info.chapters) {
    for (const v of chapter.verses) {
      const page = v.page;
      if (!pageMap[page]) pageMap[page] = [];
      pageMap[page].push({ chapter: chapter.chapter, verse: v.verse });

      verseMeta[`${chapter.chapter}:${v.verse}`] = {
        page: v.page,
        juz: v.juz,
        ruku: v.ruku,
        manzil: v.manzil,
        maqra: v.maqra,
        sajda: v.sajda,
        line: v.line,
      };
    }
  }

  // Save page mapping
  const pagesOutput = {};
  for (const [pageNum, verses] of Object.entries(pageMap)) {
    pagesOutput[pageNum] = verses;
  }
  writeFileSync(
    join(DATA_DIR, "quran-pages.json"),
    JSON.stringify(pagesOutput),
  );
  console.log(
    `  Saved quran-pages.json (${Object.keys(pagesOutput).length} pages)\n`,
  );

  // Save verse metadata
  writeFileSync(
    join(DATA_DIR, "quran-meta.json"),
    JSON.stringify({
      totalVerses: info.verses.count,
      chapters: info.chapters.map((c) => ({
        chapter: c.chapter,
        name: c.name,
        englishname: c.englishname,
        arabicname: c.arabicname,
        revelation: c.revelation,
        versesCount: c.verses.length,
      })),
      verseMeta,
    }),
  );
  console.log("  Saved quran-meta.json\n");

  // 2. Fetch Arabic text (Uthmani Hafs)
  console.log("[2/3] Fetching Arabic Uthmani Hafs text...");
  const arabicEdition = await fetchJSON(
    `${API_BASE}/editions/ara-quranuthmanihaf.min.json`,
  );

  // The full edition returns all chapters at once
  // Structure: { chapter: [ { chapter, verse, text }, ... ] } for each chapter endpoint
  // But the full edition has a different structure - let's check
  // Actually the editions endpoint returns all verses in one array

  // Group by chapter
  const arabicByChapter = {};
  for (const verse of arabicEdition.quran) {
    const ch = verse.chapter;
    if (!arabicByChapter[ch]) arabicByChapter[ch] = [];
    arabicByChapter[ch].push({
      verse: verse.verse,
      text: verse.text,
    });
  }

  writeFileSync(
    join(DATA_DIR, "quran-arabic.json"),
    JSON.stringify(arabicByChapter),
  );
  console.log(
    `  Saved quran-arabic.json (${Object.keys(arabicByChapter).length} chapters)\n`,
  );

  // 3. Fetch English translation (Sahih International)
  console.log("[3/3] Fetching English Sahih International translation...");
  const englishEdition = await fetchJSON(
    `${API_BASE}/editions/eng-ummmuhammad.min.json`,
  );

  const englishByChapter = {};
  for (const verse of englishEdition.quran) {
    const ch = verse.chapter;
    if (!englishByChapter[ch]) englishByChapter[ch] = [];
    englishByChapter[ch].push({
      verse: verse.verse,
      text: verse.text,
    });
  }

  writeFileSync(
    join(DATA_DIR, "quran-english.json"),
    JSON.stringify(englishByChapter),
  );
  console.log(
    `  Saved quran-english.json (${Object.keys(englishByChapter).length} chapters)\n`,
  );

  console.log("Done! All Quran data fetched and saved.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
