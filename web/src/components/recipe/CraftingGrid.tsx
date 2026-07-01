'use client';
import { ItemSlot } from './ItemSlot';

interface Ingredient {
  value: string;
  amount: number;
  totalNeeded: number;
  isSF: boolean;
}

interface CraftingGridProps {
  ingredients: Ingredient[];
  operations: number;
  slotSize?: number;
}

export function CraftingGrid({ ingredients, operations, slotSize = 56 }: CraftingGridProps) {
  // Merge duplicate slots (same value → sum totalNeeded)
  const merged = new Map<string, Ingredient>();
  for (const ing of ingredients) {
    const existing = merged.get(ing.value);
    if (existing) {
      merged.set(ing.value, { ...existing, totalNeeded: existing.totalNeeded + ing.totalNeeded });
    } else {
      merged.set(ing.value, { ...ing });
    }
  }
  const slots: (Ingredient | null)[] = Array(9).fill(null);
  let i = 0;
  for (const ing of merged.values()) {
    if (i >= 9) break;
    slots[i++] = ing;
  }

  return (
    <div
      className="grid gap-0.5 bg-muted p-1.5 border border-border rounded"
      style={{ gridTemplateColumns: 'repeat(3, auto)', display: 'inline-grid' }}
    >
      {slots.map((slot, idx) => (
        <ItemSlot
          key={idx}
          itemId={slot?.value}
          itemName={slot?.value}
          amount={slot ? Math.ceil(slot.totalNeeded / operations) : undefined}
          size={slotSize}
        />
      ))}
    </div>
  );
}
