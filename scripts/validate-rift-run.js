#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

require("../src/rift-run/config.js");
const engine = require("../src/rift-run/engine.js");

const root = path.resolve(__dirname, "..");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

const rawData = {
  champions: readJson("data/champions.json"),
  items: readJson("data/items.json"),
  itemTranslations: readJson("data/item-translations-ru.json"),
  abilities: readJson("data/abilities.json"),
  championStats: readJson("data/champion-stats.json"),
};

const seeds = ["rift-run-smoke", "narrow-gap", "deep-run", "specials", "constraints"];
const failures = [];

for (const seed of seeds) {
  const result = engine.simulateRun(rawData, { seed, stages: 260 });

  if (result.errors.length) {
    failures.push({ seed, errors: result.errors.slice(0, 5) });
    continue;
  }

  if (!Number.isFinite(result.summary.score) || result.summary.depth < 120) {
    failures.push({ seed, errors: [`bad summary ${JSON.stringify(result.summary)}`] });
  }
}

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}

console.log(`Rift Run validation passed for ${seeds.length} seeds.`);
