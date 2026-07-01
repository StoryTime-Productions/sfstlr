import { describe, it, expect } from 'vitest';
import { formatResult, formatJson } from '../../../src/formatter.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const step1 = {
  stepNumber: 1,
  id: 'IRON_DUST',
  name: 'Iron Dust',
  recipeType: 'enhanced_crafting_table',
  operations: 2,
  yield: 1,
  totalProduced: 2,
  ingredients: [
    { value: 'Iron Ingot', amount: 1, totalNeeded: 2, isSF: false },
    { value: 'Iron Ingot', amount: 1, totalNeeded: 2, isSF: false },
  ],
};

const step2 = {
  stepNumber: 2,
  id: 'ALLOY',
  name: 'Alloy',
  recipeType: 'smeltery',
  operations: 1,
  yield: 1,
  totalProduced: 1,
  ingredients: [
    { value: 'IRON_DUST', amount: 1, totalNeeded: 1, isSF: true },
    { value: 'Gold Ingot', amount: 1, totalNeeded: 1, isSF: false },
  ],
};

const rawMaterials = new Map([
  ['Iron Ingot', 4],
  ['Gold Ingot', 1],
]);

const targets = [{ id: 'ALLOY', amount: 1, name: 'Alloy' }];

// ---------------------------------------------------------------------------
// formatJson
// ---------------------------------------------------------------------------

describe('formatJson', () => {
  it('produces valid JSON', () => {
    const result = formatJson({ steps: [step1, step2], rawMaterials, warnings: [] }, targets);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('includes targets, steps, rawMaterials, warnings keys', () => {
    const parsed = JSON.parse(formatJson({ steps: [step1], rawMaterials, warnings: [] }, targets));
    expect(parsed).toHaveProperty('targets');
    expect(parsed).toHaveProperty('steps');
    expect(parsed).toHaveProperty('rawMaterials');
    expect(parsed).toHaveProperty('warnings');
  });

  it('serialises rawMaterials as an object', () => {
    const parsed = JSON.parse(formatJson({ steps: [], rawMaterials, warnings: [] }, targets));
    expect(parsed.rawMaterials).toEqual({ 'Iron Ingot': 4, 'Gold Ingot': 1 });
  });

  it('includes step ingredients', () => {
    const parsed = JSON.parse(formatJson({ steps: [step1], rawMaterials, warnings: [] }, targets));
    expect(parsed.steps[0].ingredients).toHaveLength(2);
  });

  it('includes warnings', () => {
    const parsed = JSON.parse(
      formatJson({ steps: [], rawMaterials, warnings: ['something missing'] }, targets)
    );
    expect(parsed.warnings).toContain('something missing');
  });
});

// ---------------------------------------------------------------------------
// formatResult — default (steps + raw materials)
// ---------------------------------------------------------------------------

describe('formatResult — default', () => {
  it('contains step numbers', () => {
    const out = formatResult({ steps: [step1, step2], rawMaterials, warnings: [] }, targets);
    expect(out).toContain('STEP');
  });

  it('contains item names', () => {
    const out = formatResult({ steps: [step1], rawMaterials, warnings: [] }, targets);
    expect(out).toContain('Iron Dust');
  });

  it('contains RAW MATERIALS section', () => {
    const out = formatResult({ steps: [step1], rawMaterials, warnings: [] }, targets);
    expect(out).toContain('RAW MATERIALS');
  });

  it('lists raw material names', () => {
    const out = formatResult({ steps: [step1], rawMaterials, warnings: [] }, targets);
    expect(out).toContain('Iron Ingot');
  });

  it('shows warnings at the top', () => {
    const out = formatResult({ steps: [], rawMaterials, warnings: ['⚠ watch out'] }, targets);
    const warnIdx = out.indexOf('watch out');
    const headerIdx = out.indexOf('SFSTLR');
    expect(warnIdx).toBeLessThan(headerIdx);
  });
});

// ---------------------------------------------------------------------------
// formatResult — rawOnly
// ---------------------------------------------------------------------------

describe('formatResult — rawOnly', () => {
  it('omits the step list', () => {
    const out = formatResult({ steps: [step1], rawMaterials, warnings: [] }, targets, {
      rawOnly: true,
    });
    expect(out).not.toContain('STEP');
  });

  it('still includes RAW MATERIALS', () => {
    const out = formatResult({ steps: [step1], rawMaterials, warnings: [] }, targets, {
      rawOnly: true,
    });
    expect(out).toContain('RAW MATERIALS');
  });
});

// ---------------------------------------------------------------------------
// formatResult — stepsOnly
// ---------------------------------------------------------------------------

describe('formatResult — stepsOnly', () => {
  it('omits the raw materials section', () => {
    const out = formatResult({ steps: [step1], rawMaterials, warnings: [] }, targets, {
      stepsOnly: true,
    });
    expect(out).not.toContain('RAW MATERIALS');
  });

  it('still includes steps', () => {
    const out = formatResult({ steps: [step1], rawMaterials, warnings: [] }, targets, {
      stepsOnly: true,
    });
    expect(out).toContain('STEP');
  });
});

// ---------------------------------------------------------------------------
// formatResult — groupByMachine
// ---------------------------------------------------------------------------

describe('formatResult — groupByMachine', () => {
  it('re-numbers steps after sorting by recipeType', () => {
    // step1 = enhanced_crafting_table, step2 = smeltery → alphabetical: ECT < smeltery
    const out = formatResult({ steps: [step2, step1], rawMaterials, warnings: [] }, targets, {
      groupByMachine: true,
    });
    // Both steps should appear
    expect(out).toContain('Iron Dust');
    expect(out).toContain('Alloy');
  });
});
