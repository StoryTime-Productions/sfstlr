import { describe, it, expect } from 'vitest';
import { BLACKLISTED_ITEMS, BLACKLISTED_RECIPE_TYPES } from '@sfstlr/blacklist';

describe('BLACKLISTED_ITEMS', () => {
  it.each(['UU_MATTER', 'SILICON', 'RUBBER', 'VOID_BIT'])('contains %s', (id) => {
    expect(BLACKLISTED_ITEMS.has(id)).toBe(true);
  });

  it('does not contain a normal SF item', () => {
    expect(BLACKLISTED_ITEMS.has('IRON_DUST')).toBe(false);
  });
});

describe('BLACKLISTED_RECIPE_TYPES', () => {
  it.each([
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
  ])('contains %s', (type) => {
    expect(BLACKLISTED_RECIPE_TYPES.has(type)).toBe(true);
  });

  it('does not contain a normal recipe type', () => {
    expect(BLACKLISTED_RECIPE_TYPES.has('enhanced_crafting_table')).toBe(false);
  });
});
