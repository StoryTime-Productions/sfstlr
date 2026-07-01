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
  // Preserve slot positions from the recipe array — each index is a grid slot (0=top-left … 8=bottom-right)
  const slots: (Ingredient | null)[] = ingredients
    .slice(0, 9)
    .map((ing) => (ing?.value ? ing : null));
  while (slots.length < 9) slots.push(null);

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
