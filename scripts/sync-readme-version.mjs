#!/usr/bin/env node
// Keeps the pinned CDN version in the README <script> snippets in sync with
// package.json. Rewrites URLs like
//   https://unpkg.com/@getchat-dev/web-button@1.4.0/dist/browser.js
//   https://cdn.jsdelivr.net/npm/@getchat-dev/web-button@1.4.0/dist/browser.js
// to the current package version.
//
//   node scripts/sync-readme-version.mjs           # rewrite the READMEs
//   node scripts/sync-readme-version.mjs --check    # exit 1 if out of sync (CI)
//
// Wired to the npm `version` lifecycle (runs on `npm version <x>`) and checked
// in CI so a hand-edited version bump that forgets to sync fails the build.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { name, version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const README_FILES = ['README.md', 'FEATURE_README.md', 'RU_README.md'];
const check = process.argv.includes('--check');

// `<name>@<version-token>` as it appears in a CDN URL — the token runs up to
// the next slash, whitespace or quote (covers 1.4.0, ^1, latest, …).
const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const re = new RegExp(esc + "@([^/\\s\"'`]+)", 'g');

const mismatches = [];
const changed = [];

for (const file of README_FILES) {
    const path = join(root, file);
    if (!existsSync(path)) continue;

    const src = readFileSync(path, 'utf8');
    let touched = false;

    const out = src.replace(re, (whole, ver) => {
        if (ver === version) return whole;
        mismatches.push(`${file}: ${name}@${ver} -> ${name}@${version}`);
        touched = true;
        return `${name}@${version}`;
    });

    if (touched && !check) {
        writeFileSync(path, out);
        changed.push(file);
    }
}

if (check) {
    if (mismatches.length) {
        console.error(`README CDN version out of sync with package.json (${version}):`);
        for (const m of mismatches) console.error('  ' + m);
        console.error('Fix with: npm run sync-readme-version');
        process.exit(1);
    }
    console.log(`README CDN URLs match ${name}@${version}`);
} else if (changed.length) {
    console.log(`synced README CDN URLs to ${version}: ${changed.join(', ')}`);
} else {
    console.log(`README CDN URLs already at ${version}`);
}
