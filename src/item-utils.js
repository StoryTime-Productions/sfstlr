import { BLACKLISTED_ITEMS, BLACKLISTED_RECIPE_TYPES } from './blacklist.js';

// An ingredient value is a Slimefun item if it is entirely uppercase (and has no spaces)
export function isSFItem(value) {
  return value === value.toUpperCase() && !value.includes(' ');
}

export function isExpandable(item) {
  if (!item) return false;
  if (BLACKLISTED_ITEMS.has(item.id)) return false;
  if (BLACKLISTED_RECIPE_TYPES.has(item.recipeType)) return false;
  return true;
}
