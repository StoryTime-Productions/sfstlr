#!/usr/bin/env node
import { loadItems } from './src/data.js';
import { resolve, cleanName } from './src/resolver.js';
import { formatResult, formatJson } from './src/formatter.js';

const USAGE = `
Usage: node sfstlr.js <ITEM_ID>[:<amount>] [...] [options]

Options:
  --refresh         Force re-download of items.json
  --raw-only        Show only the raw materials list
  --steps-only      Show only the step-by-step crafting plan
  --json            Output full result as JSON
  --no-color        Disable ANSI colors
  --help            Show this message

Examples:
  node sfstlr.js REINFORCED_ALLOY_INGOT
  node sfstlr.js STEEL_INGOT:8 CARBON_CHUNK:2
  node sfstlr.js REINFORCED_ALLOY_INGOT --refresh --json
`.trim();

// ── Argument parsing ────────────────────────────────────────────────────────

const rawArgs = process.argv.slice(2);

if (rawArgs.length === 0 || rawArgs.includes('--help')) {
  console.log(USAGE);
  process.exit(0);
}

const opts = {
  refresh: rawArgs.includes('--refresh'),
  rawOnly: rawArgs.includes('--raw-only'),
  stepsOnly: rawArgs.includes('--steps-only'),
  json: rawArgs.includes('--json'),
  noColor: rawArgs.includes('--no-color'),
  groupByMachine: rawArgs.includes('--group-by-machine'),
};

if (opts.noColor) process.env.FORCE_COLOR = '0';

const targets = rawArgs
  .filter((a) => !a.startsWith('--'))
  .map((a) => {
    const [id, amtStr] = a.split(':');
    const amount = parseInt(amtStr ?? '1', 10);
    if (isNaN(amount) || amount < 1) {
      console.error(`Invalid amount in "${a}" — must be a positive integer.`);
      process.exit(1);
    }
    return { id: id.toUpperCase(), amount };
  });

if (targets.length === 0) {
  console.error('No item IDs provided.\n\n' + USAGE);
  process.exit(1);
}

// ── Load data ───────────────────────────────────────────────────────────────

const items = await loadItems(opts.refresh);

// ── Validate item IDs (fuzzy match on failure) ───────────────────────────────

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[a.length][b.length];
}

let hasError = false;
for (const t of targets) {
  if (!items.has(t.id)) {
    console.error(`\nError: Item ID "${t.id}" not found.`);
    const ids = [...items.keys()];
    const matches = ids
      .map((id) => ({ id, dist: levenshtein(t.id, id) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5);
    console.error('Did you mean?');
    for (const m of matches) {
      console.error(`  ${m.id.padEnd(40)} — ${cleanName(items.get(m.id).name)}`);
    }
    hasError = true;
  }
}
if (hasError) process.exit(1);

// Attach display names to targets
for (const t of targets) {
  t.name = cleanName(items.get(t.id).name);
}

// ── Resolve ──────────────────────────────────────────────────────────────────

const result = resolve(targets, items);

// ── Output ───────────────────────────────────────────────────────────────────

if (opts.json) {
  console.log(formatJson(result, targets));
} else {
  console.log(formatResult(result, targets, opts));
}
