#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const MIN_LEN = 4;
const MAX_LEN = 10;
const DEFAULT_SOURCE = '/usr/share/dict/words';

function parseSourcePath() {
  const args = process.argv.slice(2);
  const sourceArgIndex = args.indexOf('--source');
  if (sourceArgIndex >= 0 && args[sourceArgIndex + 1]) {
    return args[sourceArgIndex + 1];
  }
  return DEFAULT_SOURCE;
}

function readLines(filePath) {
  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
}

function toUpperWords(words, length) {
  const alphaRegex = new RegExp(`^[a-z]{${length}}$`);
  return [...new Set(words.filter((w) => alphaRegex.test(w)).map((w) => w.toUpperCase()))].sort();
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data)}\n`);
}

const root = process.cwd();
const sourcePath = parseSourcePath();
const outputDir = path.join(root, 'src/lib/dictionaries');

if (!fs.existsSync(sourcePath)) {
  console.error(`Source dictionary not found at ${sourcePath}`);
  console.error('Pass an alternate file path with --source /path/to/wordlist');
  process.exit(1);
}

const sourceLines = readLines(sourcePath);

fs.mkdirSync(outputDir, { recursive: true });

for (let len = MIN_LEN; len <= MAX_LEN; len++) {
  const words = toUpperWords(sourceLines, len);

  if (words.length === 0) {
    console.error(`No words generated for length ${len}`);
    process.exit(1);
  }

  const outPath = path.join(outputDir, `${len}.json`);
  writeJson(outPath, words);
  console.log(`length=${len} words=${words.length} -> ${path.relative(root, outPath)}`);
}
