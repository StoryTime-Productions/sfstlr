import { readFile, writeFile, mkdir, stat } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

const ITEMS_URL = 'https://raw.githubusercontent.com/Seggan/SFCalc-Online/master/src/items.json';
const CACHE_DIR = join(homedir(), '.sfstlr');
const CACHE_FILE = join(CACHE_DIR, 'items.json');
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

async function download() {
  process.stdout.write('Downloading items.json from SFCalc-Online... ');
  const res = await fetch(ITEMS_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching items.json`);
  const text = await res.text();
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(CACHE_FILE, text, 'utf8');
  console.log('done.');
  return text;
}

export async function loadItems(forceRefresh = false) {
  let raw;

  if (!forceRefresh) {
    try {
      const s = await stat(CACHE_FILE);
      const ageMs = Date.now() - s.mtimeMs;
      if (ageMs > CACHE_MAX_AGE_MS) {
        console.warn(
          `Warning: cached items.json is ${Math.floor(ageMs / 86400000)} days old. Run with --refresh to update.`
        );
      }
      raw = await readFile(CACHE_FILE, 'utf8');
    } catch {
      // cache miss — fall through to download
    }
  }

  if (!raw) raw = await download();

  const list = JSON.parse(raw);

  // Later entries overwrite earlier ones so addon overrides take effect (matches SFCalc behavior)
  const items = new Map();
  for (const item of list) {
    items.set(item.id, item);
  }
  return items;
}
