// Real in-game recipes missing from upstream items.json because a Slimefun
// item can have more than one registered recipe (e.g. across multiple
// multiblocks) but items.json only keeps one entry per item ID.
// Each candidate has the same shape as an items.json recipe entry:
// { recipeType, result, recipe: [{ value, amount }] }
export const ALT_RECIPES = new Map([
  [
    // GrindStone.java also registers Diamond -> 4x Carbon, in addition to
    // the Compressor's Coal Block -> Carbon recipe that items.json captured.
    'CARBON',
    [{ recipeType: 'grind_stone', result: 4, recipe: [{ value: 'Diamond', amount: 1 }] }],
  ],
]);
