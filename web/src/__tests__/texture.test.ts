import { describe, it, expect } from 'vitest';
import { getTexturePath, isBlockTexture, SLOT_EMPTY } from '../lib/texture';

describe('getTexturePath', () => {
  it('returns a string for any input', () => {
    expect(typeof getTexturePath('iron_ingot')).toBe('string');
  });

  it('normalises uppercase IDs to lowercase', () => {
    const lower = getTexturePath('iron_ingot');
    const upper = getTexturePath('IRON_INGOT');
    expect(lower).toBe(upper);
  });

  it('normalises spaces to underscores', () => {
    const spaced = getTexturePath('Iron Ingot');
    const underscored = getTexturePath('iron_ingot');
    expect(spaced).toBe(underscored);
  });

  it('returns fallback.png for an unknown item', () => {
    expect(getTexturePath('THIS_ITEM_DOES_NOT_EXIST_XYZ')).toBe('/textures/fallback.png');
  });

  it('resolves glass_pane via alias to glass texture', () => {
    const panePath = getTexturePath('glass_pane');
    // alias maps glass_pane → glass; result should not be fallback
    expect(panePath).not.toBe('/textures/fallback.png');
    // and should relate to glass, not glass_pane
    expect(panePath).not.toContain('glass_pane');
  });

  it('resolves stained glass pane aliases', () => {
    const path = getTexturePath('lime_stained_glass_pane');
    expect(path).not.toBe('/textures/fallback.png');
    expect(path).not.toContain('pane');
  });
});

describe('isBlockTexture', () => {
  const blockPath = '/textures/minecraft/textures/block/stone.png';
  const itemPath = '/textures/minecraft/textures/item/iron_ingot.png';
  const sfPath = '/textures/slimefun/textures/item/iron_dust.png';

  it('returns true for a vanilla block path', () => {
    expect(isBlockTexture('stone', blockPath)).toBe(true);
  });

  it('returns false for a vanilla item path', () => {
    expect(isBlockTexture('iron_ingot', itemPath)).toBe(false);
  });

  it('returns false for a SF item path', () => {
    expect(isBlockTexture('IRON_DUST', sfPath)).toBe(false);
  });

  it('returns false for glass_pane even with a block path (alias overrides)', () => {
    expect(isBlockTexture('glass_pane', blockPath)).toBe(false);
  });

  it('returns false for any stained glass pane (alias overrides)', () => {
    expect(isBlockTexture('cyan_stained_glass_pane', blockPath)).toBe(false);
  });
});

describe('SLOT_EMPTY', () => {
  it('is a non-empty string', () => {
    expect(typeof SLOT_EMPTY).toBe('string');
    expect(SLOT_EMPTY.length).toBeGreaterThan(0);
  });
});
