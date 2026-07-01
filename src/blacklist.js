export const BLACKLISTED_ITEMS = new Set(['UU_MATTER', 'SILICON', 'RUBBER', 'VOID_BIT']);

// Recipe types whose ingredients are treated as raw materials (not expanded)
export const BLACKLISTED_RECIPE_TYPES = new Set([
  'ore_washer',
  'geo_miner',
  'gold_pan',
  'mob_drop',
  'barter_drop',
  'ore_crusher',
  'multiblock',
  'meteor_attractor',
  'alien_drop',
  'world_gen',
  'mob_killing',
  'mob_capturing',
  'breaking_grass',
  'harvest_bush',
  'harvest_tree',
  'fishing',
  'tree_tap',
  'drop-coal',
  'drop-quartz',
  'drop-lapis',
  'drop-redstone',
]);
