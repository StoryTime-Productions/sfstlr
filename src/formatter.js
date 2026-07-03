const USE_COLOR = process.stdout.isTTY;

const C = {
  reset: USE_COLOR ? '\x1b[0m' : '',
  bold: USE_COLOR ? '\x1b[1m' : '',
  cyan: USE_COLOR ? '\x1b[36m' : '',
  green: USE_COLOR ? '\x1b[32m' : '',
  yellow: USE_COLOR ? '\x1b[33m' : '',
  red: USE_COLOR ? '\x1b[31m' : '',
  dim: USE_COLOR ? '\x1b[2m' : '',
};

function machineLabel(recipeType) {
  return recipeType.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function pad(str, len) {
  return String(str).padEnd(len);
}

function header(title) {
  const line = '═'.repeat(title.length + 4);
  return `${C.bold}╔${line}╗\n║  ${title}  ║\n╚${line}╝${C.reset}`;
}

function divider(width = 60) {
  return C.dim + '─'.repeat(width) + C.reset;
}

export function formatResult({ steps, rawMaterials, warnings }, targets, opts = {}) {
  const lines = [];

  if (warnings.length) {
    for (const w of warnings) lines.push(`${C.yellow}⚠ ${w}${C.reset}`);
    lines.push('');
  }

  const targetStr = targets
    .map((t) => `${C.bold}${t.name ?? t.id}${C.reset} x${t.amount}`)
    .join(', ');

  if (!opts.rawOnly) {
    lines.push(header('SFSTLR — Step-by-Step Crafting Plan'));
    lines.push('');
    lines.push(`Target: ${targetStr}`);
    lines.push('');

    // --group-by-machine: stable-sort by recipeType while preserving relative dep order
    const displaySteps = opts.groupByMachine
      ? [...steps].sort((a, b) => a.recipeType.localeCompare(b.recipeType))
      : steps;

    displaySteps.forEach((s, i) => {
      s.stepNumber = i + 1;
    });

    for (const step of displaySteps) {
      const machine = `${C.cyan}[${machineLabel(step.recipeType)}]${C.reset}`;
      const item = `${C.bold}${step.name}${C.reset} x${step.totalProduced}`;
      const ops = step.operations > 1 ? `${C.dim}(${step.operations} operations)${C.reset}` : '';
      const alt = step.usedAlt ? `${C.yellow}(alt)${C.reset}` : '';

      lines.push(
        `STEP ${String(step.stepNumber).padStart(2)}  ${machine}  ${item}  ${ops}  ${alt}`
      );

      // Merge duplicate ingredient slots (same value can appear in multiple grid slots)
      const ingMerged = new Map();
      for (const ing of step.ingredients) {
        const existing = ingMerged.get(ing.value);
        if (existing) existing.totalNeeded += ing.totalNeeded;
        else ingMerged.set(ing.value, { ...ing });
      }
      const ingParts = [...ingMerged.values()].map((ing) => {
        const color = ing.isSF ? C.reset : C.green;
        return `${color}${ing.value}${C.reset} x${ing.totalNeeded}`;
      });
      lines.push(`        ${C.dim}In:${C.reset}   ${ingParts.join(', ')}`);
      lines.push(
        `        ${C.dim}Out:${C.reset}  ${C.bold}${step.name}${C.reset} x${step.totalProduced}`
      );
      lines.push('');
    }
  }

  if (!opts.stepsOnly) {
    lines.push(divider());
    lines.push(
      `${C.bold}RAW MATERIALS${C.reset}  ${C.dim}(everything you need to gather)${C.reset}`
    );
    lines.push(divider());

    const sorted = [...rawMaterials].sort((a, b) => b[1] - a[1]);
    const maxNameLen = Math.max(...sorted.map(([n]) => n.length), 12);
    for (const [name, amount] of sorted) {
      lines.push(`  ${C.green}${pad(name, maxNameLen)}${C.reset}  x${amount}`);
    }
  }

  return lines.join('\n');
}

export function formatJson({ steps, rawMaterials, warnings }, targets) {
  return JSON.stringify(
    {
      targets,
      steps: steps.map((s) => ({
        ...s,
        ingredients: s.ingredients.map((i) => ({ ...i })),
      })),
      rawMaterials: Object.fromEntries(rawMaterials),
      warnings,
    },
    null,
    2
  );
}
