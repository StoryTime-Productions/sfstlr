import { isSFItem, isExpandable } from './item-utils.js';
import { ALT_RECIPES } from './alt-recipes.js';

const RAW_COST = 1;

function candidatesFor(id, item, useAltRecipes) {
  const list = [];
  if (item.recipe) {
    list.push({
      recipeType: item.recipeType,
      result: item.result,
      recipe: item.recipe,
      usedAlt: false,
    });
  }
  if (useAltRecipes) {
    for (const alt of ALT_RECIPES.get(id) ?? []) {
      list.push({ ...alt, usedAlt: true });
    }
  }
  return list;
}

/**
 * Builds a per-item-map cost calculator that picks, for each expandable item,
 * whichever known recipe (upstream or from ALT_RECIPES) has the lowest cost
 * per unit produced. Cost is amount-independent (no economies of scale) and
 * computed via memoized recursive DFS with cycle guarding.
 *
 * @param {Map<string, object>} itemMap
 * @param {{ useAltRecipes?: boolean }} [opts] - set useAltRecipes: false to only consider upstream recipes
 * @returns {{ getRecipe: (id: string) => ({recipeType, result, recipe, usedAlt} | undefined) }}
 */
export function computeCheapestRecipes(itemMap, opts = {}) {
  const useAltRecipes = opts.useAltRecipes !== false;
  const chosen = new Map();
  const unitCostCache = new Map();
  const visiting = new Set();

  function unitCost(id) {
    if (unitCostCache.has(id)) return unitCostCache.get(id);

    const item = itemMap.get(id);
    if (!item || !isExpandable(item)) return RAW_COST;

    if (visiting.has(id)) return Infinity; // cycle guard — don't recurse forever
    visiting.add(id);

    let best = Infinity;
    let bestCandidate = null;

    for (const candidate of candidatesFor(id, item, useAltRecipes)) {
      if (!candidate.result || candidate.result <= 0) continue;

      let cost = 0;
      for (const ing of candidate.recipe ?? []) {
        const ingUnit = isSFItem(ing.value) ? unitCost(ing.value) : RAW_COST;
        cost += ing.amount * ingUnit;
      }
      cost /= candidate.result;

      // Always take the first candidate even at Infinity cost (e.g. a data
      // cycle) so resolver.js still gets a recipe to walk into and detect
      // the cycle itself, rather than silently treating the item as raw.
      if (bestCandidate === null || cost < best) {
        best = cost;
        bestCandidate = candidate;
      }
    }

    visiting.delete(id);
    unitCostCache.set(id, best);
    if (bestCandidate) chosen.set(id, bestCandidate);
    return best;
  }

  return {
    getRecipe(id) {
      unitCost(id);
      return chosen.get(id);
    },
  };
}
