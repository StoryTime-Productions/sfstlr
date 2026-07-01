import textureIndex from '../../public/textures/index.json';
import spriteFramesData from './sprite_frames.json';

const index = textureIndex as Record<string, string>;
const spriteFrames = spriteFramesData as Record<string, number>;

// Flat items that borrow another item's texture — these stay 2D even though
// the resolved texture may live in a block folder.
const FLAT_ALIASES: Record<string, string> = {
  eye_of_ender: 'ender_eye',
  glass_pane: 'glass',
  gray_stained_glass_pane: 'gray_stained_glass',
  white_stained_glass_pane: 'white_stained_glass',
  orange_stained_glass_pane: 'orange_stained_glass',
  magenta_stained_glass_pane: 'magenta_stained_glass',
  light_blue_stained_glass_pane: 'light_blue_stained_glass',
  yellow_stained_glass_pane: 'yellow_stained_glass',
  lime_stained_glass_pane: 'lime_stained_glass',
  pink_stained_glass_pane: 'pink_stained_glass',
  cyan_stained_glass_pane: 'cyan_stained_glass',
  purple_stained_glass_pane: 'purple_stained_glass',
  blue_stained_glass_pane: 'blue_stained_glass',
  brown_stained_glass_pane: 'brown_stained_glass',
  green_stained_glass_pane: 'green_stained_glass',
  red_stained_glass_pane: 'red_stained_glass',
  black_stained_glass_pane: 'black_stained_glass',
};

// Vanilla "Block of X" display names → Minecraft texture namespace keys.
// These ARE 3D blocks, so they are NOT in FLAT_ALIASES.
const BLOCK_ALIASES: Record<string, string> = {
  block_of_amethyst: 'amethyst_block',
  block_of_coal: 'coal_block',
  block_of_copper: 'copper_block',
  block_of_diamond: 'diamond_block',
  block_of_emerald: 'emerald_block',
  block_of_gold: 'gold_block',
  block_of_iron: 'iron_block',
  block_of_lapis_lazuli: 'lapis_block',
  block_of_netherite: 'netherite_block',
  block_of_quartz: 'quartz_block',
  block_of_raw_copper: 'raw_copper_block',
  block_of_raw_gold: 'raw_gold_block',
  block_of_raw_iron: 'raw_iron_block',
  block_of_redstone: 'redstone_block',
  waxed_block_of_copper: 'copper_block',
};

const ALIASES: Record<string, string> = { ...FLAT_ALIASES, ...BLOCK_ALIASES };

export function getTexturePath(itemId: string): string {
  const key = itemId.toLowerCase().replace(/\s+/g, '_');
  const resolved = ALIASES[key] ?? key;
  return (
    index[resolved] ?? index[resolved + '_top'] ?? index[key + '_top'] ?? '/textures/fallback.png'
  );
}

export const SLOT_EMPTY = index['pane_gray'] ?? '/textures/fallback.png';

// Slimefun folder segments whose contents are placed blocks (rendered as 3D cubes).
const SF_BLOCK_FOLDERS = [
  '/machines/',
  '/basic_machines/',
  '/cargo/',
  '/energy/',
  '/androids/',
  '/gps/',
] as const;

// SF textures that live inside a block folder but are 2D items (cables, connectors, capacitors, etc.).
const SF_FLAT_FILENAMES = new Set([
  'energy_connector',
  'small_capacitor',
  'medium_capacitor',
  'large_capacitor',
  'big_capacitor',
  'energized_capacitor',
  'carbonado_edged_capacitor',
  'infinity_capacitor',
  'void_capacitor',
  'netherstar_reactor',
]);

/** Returns the number of animation frames for a sprite-column texture, or 1 if it's a still image. */
export function getSpriteFrames(itemId: string): number {
  const key = itemId.toLowerCase().replace(/\s+/g, '_');
  const resolved = ALIASES[key] ?? key;
  return spriteFrames[resolved] ?? spriteFrames[key] ?? 1;
}

/** True for vanilla Minecraft block textures or SF machine/block textures (renders as isometric 3D cube). */
export function isBlockTexture(itemId: string, path: string): boolean {
  const key = itemId.toLowerCase().replace(/\s+/g, '_');
  if (key in FLAT_ALIASES) return false;
  if (path.includes('/minecraft/textures/block/')) return true;
  const filename = path.split('/').pop()?.replace('.png', '') ?? '';
  if (SF_FLAT_FILENAMES.has(filename)) return false;
  return SF_BLOCK_FOLDERS.some((f) => path.includes(f));
}
