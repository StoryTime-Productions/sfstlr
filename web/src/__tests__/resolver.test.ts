import { describe, it, expect } from 'vitest';
import { resolve, cleanName } from '@sfstlr/resolver';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItem(
  id: string,
  name: string,
  recipeType: string,
  result: number,
  recipe: { value: string; amount: number }[]
) {
  return { id, name, recipeType, result, recipe };
}

function itemMap(items: ReturnType<typeof makeItem>[]) {
  return new Map(items.map((i) => [i.id, i]));
}

// ---------------------------------------------------------------------------
// cleanName
// ---------------------------------------------------------------------------

describe('cleanName', () => {
  it('returns plain names unchanged', () => {
    expect(cleanName('Iron Ingot')).toBe('Iron Ingot');
  });

  it('strips §X color codes', () => {
    expect(cleanName('§6Gold Ingot')).toBe('Gold Ingot');
  });

  it('strips multiple color codes', () => {
    expect(cleanName('§a§lShiny§r Item')).toBe('Shiny Item');
  });

  it('strips Â§X double-encoded codes', () => {
    expect(cleanName('Â§6Amber')).toBe('Amber');
  });

  it('handles empty string', () => {
    expect(cleanName('')).toBe('');
  });

  it('handles null/undefined gracefully', () => {
    expect(cleanName(null as unknown as string)).toBe('');
    expect(cleanName(undefined as unknown as string)).toBe('');
  });

  it('trims surrounding whitespace', () => {
    expect(cleanName('  Dust  ')).toBe('Dust');
  });
});

// ---------------------------------------------------------------------------
// resolve — empty / trivial cases
// ---------------------------------------------------------------------------

describe('resolve — empty inputs', () => {
  it('returns empty steps and rawMaterials for no targets', () => {
    const { steps, rawMaterials, warnings } = resolve([], new Map());
    expect(steps).toHaveLength(0);
    expect(rawMaterials.size).toBe(0);
    expect(warnings).toHaveLength(0);
  });

  it('emits a warning for an unknown target ID', () => {
    const { steps, warnings } = resolve([{ id: 'UNKNOWN_ITEM', amount: 1 }], new Map());
    expect(steps).toHaveLength(0);
    expect(warnings).toContain('Target item not found: UNKNOWN_ITEM');
  });
});

// ---------------------------------------------------------------------------
// resolve — raw / non-expandable targets
// ---------------------------------------------------------------------------

describe('resolve — raw/non-expandable targets', () => {
  it('adds an unknown target ID to rawMaterials with a warning', () => {
    // Item not in map at all — warning emitted, but no step created
    const { steps, rawMaterials, warnings } = resolve(
      [{ id: 'UNKNOWN_RAW', amount: 5 }],
      new Map()
    );
    expect(steps).toHaveLength(0);
    // Unknown targets still land in rawMaterials (you need to gather them somehow)
    expect(rawMaterials.get('UNKNOWN_RAW')).toBe(5);
    expect(warnings.some((w: string) => w.includes('UNKNOWN_RAW'))).toBe(true);
  });

  it('adds a blacklisted item target to rawMaterials', () => {
    const map = itemMap([makeItem('SILICON', 'Silicon', 'smelting', 1, [])]);
    const { rawMaterials } = resolve([{ id: 'SILICON', amount: 3 }], map);
    expect(rawMaterials.get('SILICON')).toBe(3);
  });

  it('adds a blacklisted recipe-type target to rawMaterials', () => {
    const map = itemMap([makeItem('ORE_DUST', 'Ore Dust', 'ore_washer', 1, [])]);
    const { rawMaterials } = resolve([{ id: 'ORE_DUST', amount: 2 }], map);
    expect(rawMaterials.get('ORE_DUST')).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// resolve — single-level recipe
// ---------------------------------------------------------------------------

describe('resolve — single-level recipe', () => {
  const IRON = makeItem('Iron Ingot', 'Iron Ingot', 'null', 1, []);
  const DUST = makeItem('IRON_DUST', 'Iron Dust', 'enhanced_crafting_table', 1, [
    { value: 'Iron Ingot', amount: 1 },
  ]);

  it('produces one step for a simple craftable item', () => {
    const map = itemMap([IRON, DUST]);
    const { steps } = resolve([{ id: 'IRON_DUST', amount: 1 }], map);
    expect(steps).toHaveLength(1);
    expect(steps[0].id).toBe('IRON_DUST');
  });

  it('puts the vanilla ingredient into rawMaterials', () => {
    const map = itemMap([IRON, DUST]);
    const { rawMaterials } = resolve([{ id: 'IRON_DUST', amount: 1 }], map);
    expect(rawMaterials.get('Iron Ingot')).toBe(1);
  });

  it('scales operations for amounts > yield', () => {
    const map = itemMap([IRON, DUST]);
    const { steps } = resolve([{ id: 'IRON_DUST', amount: 3 }], map);
    expect(steps[0].operations).toBe(3);
    expect(steps[0].totalProduced).toBe(3);
  });

  it('ceils operations (partial batches)', () => {
    const BATCH_ITEM = makeItem('BATCH_ITEM', 'Batch', 'enhanced_crafting_table', 4, [
      { value: 'Iron Ingot', amount: 2 },
    ]);
    const map = itemMap([IRON, BATCH_ITEM]);
    const { steps } = resolve([{ id: 'BATCH_ITEM', amount: 5 }], map);
    // need 5, yield 4 per op → ceil(5/4) = 2 ops
    expect(steps[0].operations).toBe(2);
    expect(steps[0].totalProduced).toBe(8);
  });

  it('step has correct shape', () => {
    const map = itemMap([IRON, DUST]);
    const { steps } = resolve([{ id: 'IRON_DUST', amount: 1 }], map);
    const s = steps[0];
    expect(s).toMatchObject({
      id: 'IRON_DUST',
      recipeType: 'enhanced_crafting_table',
      operations: 1,
      yield: 1,
      stepNumber: 1,
    });
    expect(s.ingredients[0]).toMatchObject({ value: 'Iron Ingot', amount: 1, isSF: false });
  });
});

// ---------------------------------------------------------------------------
// resolve — two-level chain (topological order)
// ---------------------------------------------------------------------------

describe('resolve — multi-level chain', () => {
  // ALLOY needs DUST_A (SF) + Iron Ingot (vanilla)
  // DUST_A needs Iron Ingot (vanilla)
  const IRON = makeItem('Iron Ingot', 'Iron Ingot', 'null', 1, []);
  const DUST_A = makeItem('DUST_A', 'Dust A', 'enhanced_crafting_table', 1, [
    { value: 'Iron Ingot', amount: 2 },
  ]);
  const ALLOY = makeItem('ALLOY', 'Alloy', 'enhanced_crafting_table', 1, [
    { value: 'DUST_A', amount: 1 },
    { value: 'Iron Ingot', amount: 1 },
  ]);

  it('returns two steps', () => {
    const map = itemMap([IRON, DUST_A, ALLOY]);
    const { steps } = resolve([{ id: 'ALLOY', amount: 1 }], map);
    expect(steps).toHaveLength(2);
  });

  it('orders steps leaves-first (DUST_A before ALLOY)', () => {
    const map = itemMap([IRON, DUST_A, ALLOY]);
    const { steps } = resolve([{ id: 'ALLOY', amount: 1 }], map);
    const ids = steps.map((s: { id: string }) => s.id);
    expect(ids.indexOf('DUST_A')).toBeLessThan(ids.indexOf('ALLOY'));
  });

  it('aggregates raw materials from all steps', () => {
    const map = itemMap([IRON, DUST_A, ALLOY]);
    const { rawMaterials } = resolve([{ id: 'ALLOY', amount: 1 }], map);
    // DUST_A needs 2 iron, ALLOY needs 1 iron directly → 3 total
    expect(rawMaterials.get('Iron Ingot')).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// resolve — blacklisted ingredient treated as raw
// ---------------------------------------------------------------------------

describe('resolve — blacklisted ingredient', () => {
  it('treats a blacklisted SF ingredient as raw material', () => {
    const SILICON = makeItem('SILICON', 'Silicon', 'smelting', 1, []);
    const CIRCUIT = makeItem('CIRCUIT', 'Circuit', 'enhanced_crafting_table', 1, [
      { value: 'SILICON', amount: 2 },
    ]);
    const map = itemMap([SILICON, CIRCUIT]);
    const { steps, rawMaterials } = resolve([{ id: 'CIRCUIT', amount: 1 }], map);
    expect(steps).toHaveLength(1);
    // SILICON is blacklisted → raw material
    expect(rawMaterials.get('SILICON')).toBe(2);
  });

  it('warns when an SF ingredient ID is unknown', () => {
    const ITEM = makeItem('MY_ITEM', 'My Item', 'enhanced_crafting_table', 1, [
      { value: 'GHOST_ITEM', amount: 1 },
    ]);
    const map = itemMap([ITEM]);
    const { warnings } = resolve([{ id: 'MY_ITEM', amount: 1 }], map);
    expect(warnings.some((w: string) => w.includes('GHOST_ITEM'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// resolve — cycle detection
// ---------------------------------------------------------------------------

describe('resolve — cycle detection', () => {
  it('emits a warning and does not crash on a cycle', () => {
    const A = makeItem('ITEM_A', 'A', 'enhanced_crafting_table', 1, [
      { value: 'ITEM_B', amount: 1 },
    ]);
    const B = makeItem('ITEM_B', 'B', 'enhanced_crafting_table', 1, [
      { value: 'ITEM_A', amount: 1 },
    ]);
    const map = itemMap([A, B]);
    const { warnings } = resolve([{ id: 'ITEM_A', amount: 1 }], map);
    expect(warnings.some((w: string) => w.includes('Cycle detected'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// resolve — multiple targets
// ---------------------------------------------------------------------------

describe('resolve — multiple targets', () => {
  it('aggregates steps from multiple targets', () => {
    const IRON = makeItem('Iron Ingot', 'Iron Ingot', 'null', 1, []);
    const A = makeItem('ITEM_A', 'A', 'enhanced_crafting_table', 1, [
      { value: 'Iron Ingot', amount: 1 },
    ]);
    const B = makeItem('ITEM_B', 'B', 'enhanced_crafting_table', 1, [
      { value: 'Iron Ingot', amount: 2 },
    ]);
    const map = itemMap([IRON, A, B]);
    const { steps, rawMaterials } = resolve(
      [
        { id: 'ITEM_A', amount: 1 },
        { id: 'ITEM_B', amount: 1 },
      ],
      map
    );
    expect(steps).toHaveLength(2);
    expect(rawMaterials.get('Iron Ingot')).toBe(3);
  });
});
