import { isSFItem, isExpandable } from './item-utils.js';
import { computeCheapestRecipes } from './costing.js';

/**
 * Resolve the full recipe tree for a list of target items.
 *
 * @param {Array<{id: string, amount: number}>} targets
 * @param {Map<string, object>} itemMap
 * @param {{ useAltRecipes?: boolean }} [opts] - set useAltRecipes: false to only use upstream recipes
 * @returns {{ steps: CraftStep[], rawMaterials: Map<string, number>, warnings: string[] }}
 *
 * CraftStep = {
 *   id, name, recipeType, operations, yield, usedAlt,
 *   ingredients: [{value, amount, totalNeeded, isSF}]
 * }
 */
export function resolve(targets, itemMap, opts = {}) {
  const warnings = [];

  // operations[id] = total number of crafting operations needed for that SF item
  const operations = new Map();
  // adjacency: id → Set of SF item IDs it directly depends on (for topo sort)
  const deps = new Map();

  const visiting = new Set(); // cycle detection
  const costing = computeCheapestRecipes(itemMap, { useAltRecipes: opts.useAltRecipes });

  function expand(id, needed) {
    const item = itemMap.get(id);
    if (!item || !isExpandable(item)) return; // raw / blacklisted — leaf node

    if (visiting.has(id)) {
      warnings.push(`Cycle detected at ${id} — breaking.`);
      return;
    }

    const recipe = costing.getRecipe(id);
    if (!recipe) return; // no usable candidate (e.g. zero-yield) — treat as leaf

    const ops = Math.ceil(needed / recipe.result);
    operations.set(id, (operations.get(id) ?? 0) + ops);

    if (!deps.has(id)) deps.set(id, new Set());

    visiting.add(id);

    for (const ing of recipe.recipe ?? []) {
      const ingTotal = ing.amount * ops;
      if (isSFItem(ing.value)) {
        const ingItem = itemMap.get(ing.value);
        if (!ingItem) {
          warnings.push(
            `Unknown SF item in recipe: ${ing.value} (ingredient of ${id}) — treated as raw.`
          );
        } else if (isExpandable(ingItem)) {
          deps.get(id).add(ing.value);
          expand(ing.value, ingTotal);
        }
      }
    }

    visiting.delete(id);
  }

  for (const { id, amount } of targets) {
    if (!itemMap.has(id)) {
      warnings.push(`Target item not found: ${id}`);
      continue;
    }
    expand(id, amount);
  }

  // Topological sort (Kahn's algorithm) — leaves first (bottom-up crafting order)
  // inDegree[id] = number of SF prerequisites id still needs crafted before it
  // reverseDeps[dep] = set of IDs that directly depend on dep
  const inDegree = new Map();
  const reverseDeps = new Map();
  for (const [id, depSet] of deps) {
    inDegree.set(id, depSet.size);
    for (const dep of depSet) {
      if (!reverseDeps.has(dep)) reverseDeps.set(dep, new Set());
      reverseDeps.get(dep).add(id);
    }
  }

  const queue = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted = [];
  let lastMachine = null;
  while (queue.length) {
    // Prefer same machine as last step to minimise switching overhead
    let pickIdx = lastMachine
      ? queue.findIndex((id) => itemMap.get(id)?.recipeType === lastMachine)
      : -1;
    if (pickIdx === -1) pickIdx = 0;
    const [id] = queue.splice(pickIdx, 1);
    sorted.push(id);
    lastMachine = itemMap.get(id)?.recipeType ?? null;
    for (const dependent of reverseDeps.get(id) ?? []) {
      if (!inDegree.has(dependent)) continue;
      const newDeg = inDegree.get(dependent) - 1;
      inDegree.set(dependent, newDeg);
      if (newDeg === 0) queue.push(dependent);
    }
  }

  // Build step objects in crafting order (leaves first)
  const steps = sorted.map((id, idx) => {
    const item = itemMap.get(id);
    const recipe = costing.getRecipe(id);
    const ops = operations.get(id);
    const ingredients = (recipe.recipe ?? []).map((ing) => {
      const totalNeeded = ing.amount * ops;
      return { value: ing.value, amount: ing.amount, totalNeeded, isSF: isSFItem(ing.value) };
    });
    return {
      stepNumber: idx + 1,
      id,
      name: cleanName(item.name),
      recipeType: recipe.recipeType ?? 'null',
      operations: ops,
      yield: recipe.result,
      totalProduced: ops * recipe.result,
      usedAlt: !!recipe.usedAlt,
      ingredients,
    };
  });

  // Aggregate raw materials (vanilla MC items across all steps)
  const rawMaterials = new Map();
  for (const step of steps) {
    for (const ing of step.ingredients) {
      if (!ing.isSF) {
        rawMaterials.set(ing.value, (rawMaterials.get(ing.value) ?? 0) + ing.totalNeeded);
      } else {
        // SF item that is a blacklisted leaf (expandable=false) counts as raw
        const ingItem = itemMap.get(ing.value);
        if (!ingItem || !isExpandable(ingItem)) {
          rawMaterials.set(ing.value, (rawMaterials.get(ing.value) ?? 0) + ing.totalNeeded);
        }
      }
    }
  }

  // Also add target items that are themselves raw/blacklisted
  for (const { id, amount } of targets) {
    const item = itemMap.get(id);
    if (!item || !isExpandable(item)) {
      rawMaterials.set(id, (rawMaterials.get(id) ?? 0) + amount);
    }
  }

  return { steps, rawMaterials, warnings };
}

// Strip MC color codes (§X or Â§X from double-encoding in items.json)
export function cleanName(name) {
  return (name ?? '').replace(/Â/g, '').replace(/§./g, '').trim();
}
