import textureIndex from '../../public/textures/index.json';

const index = textureIndex as Record<string, string>;

// Items whose inventory icon uses a different texture than their own name.
// Source: Minecraft item model JSON (item/generated with layer0 pointing elsewhere).
const ALIASES: Record<string, string> = {
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

export function getTexturePath(itemId: string): string {
  const key = itemId.toLowerCase().replace(/\s+/g, '_');
  const resolved = ALIASES[key] ?? key;
  // Some blocks only have a _top face texture in the JAR (e.g. glass_pane_top, not glass_pane)
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

/** True for vanilla Minecraft block textures or SF machine/block textures (renders as isometric 3D cube). */
export function isBlockTexture(itemId: string, path: string): boolean {
  const key = itemId.toLowerCase().replace(/\s+/g, '_');
  if (key in ALIASES) return false;
  if (path.includes('/minecraft/textures/block/')) return true;
  return SF_BLOCK_FOLDERS.some((f) => path.includes(f));
}
