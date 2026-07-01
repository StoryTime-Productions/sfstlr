import { readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

// Source: Slimefun4/src/main/java/io/github/thebusybiscuit/slimefun4/implementation/setup/SlimefunItemSetup.java
const VANILLA_FUEL_TABLE = {
  // ── No fuel ────────────────────────────────────────────────────────────────
  enhanced_crafting_table: { fuelType: 'none' },
  magic_workbench: { fuelType: 'none' },
  ancient_altar: { fuelType: 'none' },
  armor_forge: { fuelType: 'none' },
  grind_stone: { fuelType: 'none' },
  juicer: { fuelType: 'none' },
  kitchen: { fuelType: 'none' },
  melter: { fuelType: 'none' },
  null: { fuelType: 'none' },
  dummy_table: { fuelType: 'none' },
  'dummy-table': { fuelType: 'none' },
  'dummy-workbench': { fuelType: 'none' },

  // ── Coal-fueled multiblock machines ────────────────────────────────────────
  // 1 coal consumed per operation (placed in the dispenser/ignition chamber)
  smeltery: { fuelType: 'coal', perOperation: 1, note: 'Ignition Chamber' },
  compressor: { fuelType: 'coal', perOperation: 1, note: 'Dispenser' },
  pressure_chamber: { fuelType: 'coal', perOperation: 1, note: 'Dispenser' },
  ore_crusher: { fuelType: 'coal', perOperation: 1, note: 'Dispenser (blacklisted)' },

  // ── Electric machines (Joules per tick from source) ─────────────────────────
  // Total J per op = jPerTick × processing_ticks (processing time varies by tier/recipe)
  heated_pressure_chamber: {
    fuelType: 'electric',
    jPerTick: 5,
    buffer: 128,
    tiers: [
      { tier: 1, jPerTick: 5 },
      { tier: 2, jPerTick: 22 },
    ],
  },
  circuit_press: {
    fuelType: 'electric',
    jPerTick: 10,
    buffer: 256,
    tiers: [
      { tier: 1, jPerTick: 10 },
      { tier: 2, jPerTick: 25 },
      { tier: 3, jPerTick: 90 },
    ],
  },
  'metal-press': {
    fuelType: 'electric',
    jPerTick: 8,
    buffer: 256,
    tiers: [
      { tier: 1, jPerTick: 8 },
      { tier: 2, jPerTick: 20 },
    ],
  },
  'die-press': { fuelType: 'electric', jPerTick: 7, buffer: 512 },
  assembly_table: { fuelType: 'electric', jPerTick: 50, buffer: 512 },
  refinery: { fuelType: 'electric', jPerTick: 150, buffer: 1024 },
  freezer: { fuelType: 'electric', jPerTick: 5, buffer: 128 },
  nuclear_reactor: {
    fuelType: 'electric',
    jPerTick: 0,
    note: 'Generates power (nuclear fuel rod)',
  },
};

let overrides = null;

async function loadOverrides() {
  if (overrides !== null) return overrides;
  const overridesFile = join(homedir(), '.sfstlr', 'fuel-overrides.json');
  try {
    const raw = await readFile(overridesFile, 'utf8');
    overrides = JSON.parse(raw);
  } catch {
    overrides = {};
  }
  return overrides;
}

export async function getFuelInfo(recipeType) {
  const userOverrides = await loadOverrides();
  return userOverrides[recipeType] ?? VANILLA_FUEL_TABLE[recipeType] ?? { fuelType: 'unknown' };
}

/**
 * Format fuel info for display on a single step.
 * @param {{ fuelType: string, perOperation?: number, jPerTick?: number, tiers?: object[], note?: string }} info
 * @param {number} operations
 */
export function formatFuel(info, operations) {
  if (!info || info.fuelType === 'none') return null;
  if (info.fuelType === 'coal') {
    const total = (info.perOperation ?? 1) * operations;
    return `${total} coal`;
  }
  if (info.fuelType === 'electric') {
    if (info.note) return info.note;
    const tierStr = info.tiers
      ? info.tiers.map((t) => `T${t.tier}: ${t.jPerTick} J/tick`).join(', ')
      : `${info.jPerTick} J/tick`;
    return `${tierStr} (electric — processing time varies)`;
  }
  return `unknown (addon machine: ${info.note ?? ''})`;
}

/**
 * Aggregate fuel totals across all steps for the summary block.
 * Returns { coal: number, electricMachines: Set<string>, unknownMachines: Set<string> }
 */
export async function aggregateFuel(steps) {
  let coal = 0;
  const electricMachines = new Set();
  const unknownMachines = new Set();

  for (const step of steps) {
    const info = await getFuelInfo(step.recipeType);
    if (info.fuelType === 'coal') {
      coal += (info.perOperation ?? 1) * step.operations;
    } else if (info.fuelType === 'electric') {
      electricMachines.add(step.recipeType);
    } else if (info.fuelType === 'unknown') {
      unknownMachines.add(step.recipeType);
    }
  }

  return { coal, electricMachines, unknownMachines };
}
