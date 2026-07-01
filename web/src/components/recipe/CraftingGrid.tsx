'use client';
import { ItemSlot } from './ItemSlot';
import recipeShapes from '@/lib/recipe_shapes.json';

interface Ingredient {
  value: string;
  amount: number;
  totalNeeded: number;
  isSF: boolean;
}

interface CraftingGridProps {
  ingredients: Ingredient[];
  operations: number;
  itemId?: string;
  slotSize?: number;
}

const shapes = recipeShapes as Record<string, boolean[]>;

export function CraftingGrid({
  ingredients,
  operations,
  itemId,
  slotSize = 56,
}: CraftingGridProps) {
  const nonEmpty = ingredients.filter((ing) => ing?.value);
  const mask = itemId ? shapes[itemId] : undefined;

  let slots: (Ingredient | null)[];
  if (mask && mask.filter(Boolean).length === nonEmpty.length) {
    // Distribute flat ingredients into their shaped positions
    let idx = 0;
    slots = mask.map((occupied) => (occupied ? (nonEmpty[idx++] ?? null) : null));
  } else {
    // Fallback: pack left-to-right (no shape data)
    slots = nonEmpty.slice(0, 9);
    while (slots.length < 9) slots.push(null);
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
