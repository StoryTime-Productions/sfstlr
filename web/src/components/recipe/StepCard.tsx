'use client';
import { useState, useEffect } from 'react';
import { CraftingGrid } from './CraftingGrid';
import { ItemSlot } from './ItemSlot';
import { getTexturePath } from '@/lib/texture';
import { fmtCount } from '@/lib/format';

interface Ingredient {
  value: string;
  amount: number;
  totalNeeded: number;
  isSF: boolean;
}

interface Step {
  stepNumber: number;
  id: string;
  name: string;
  recipeType: string;
  operations: number;
  yield: number;
  totalProduced: number;
  usedAlt: boolean;
  ingredients: Ingredient[];
}

function machineLabel(recipeType: string): string {
  return recipeType.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface StepCardProps {
  step: Step;
  isLast?: boolean;
  /** Override from parent (collapse-all / expand-all). undefined = use local state. */
  forceExpanded?: boolean;
  showStacks?: boolean;
}

export function StepCard({ step, isLast, forceExpanded, showStacks = false }: StepCardProps) {
  const [expanded, setExpanded] = useState(true);

  // Sync with parent collapse-all / expand-all, but allow individual toggle afterward
  useEffect(() => {
    if (forceExpanded !== undefined) setExpanded(forceExpanded);
  }, [forceExpanded]);

  const machineTexture = getTexturePath(step.recipeType);

  return (
    <div className="relative">
      {/* Step connector line */}
      {!isLast && (
        <div className="absolute left-1/2 bottom-0 w-0.5 h-3 bg-border -translate-x-1/2 translate-y-full z-10" />
      )}

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Header — always visible, click to toggle */}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
        >
          <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
            STEP {step.stepNumber}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={machineTexture}
            alt={machineLabel(step.recipeType)}
            width={20}
            height={20}
            style={{ imageRendering: 'pixelated' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="text-sm font-semibold text-primary flex-1 truncate">
            {machineLabel(step.recipeType)}
          </span>

          {step.usedAlt && (
            <span
              title="This step uses a real in-game recipe that's missing from the default recipe data (this item has more than one known recipe)."
              className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 shrink-0"
            >
              Alt
            </span>
          )}

          {/* Collapsed summary: output thumbnail + name */}
          {!expanded && (
            <span className="flex items-center gap-1.5 text-xs text-foreground/70 shrink-0">
              <ItemSlot itemId={step.id} itemName={step.name} size={24} />
              <span className="max-w-[120px] truncate">{step.name}</span>
              {step.operations > 1 && (
                <span className="text-muted-foreground">×{step.operations}</span>
              )}
            </span>
          )}

          {expanded && step.operations > 1 && (
            <span className="text-xs text-muted-foreground shrink-0">
              {step.operations} operations
            </span>
          )}

          {/* Chevron */}
          <span className="text-muted-foreground text-xs shrink-0 ml-1">
            {expanded ? '▲' : '▼'}
          </span>
        </button>

        {/* Expandable body */}
        {expanded && (
          <div className="px-4 pb-4">
            {/* Recipe: grid → arrow → output */}
            <div className="flex items-center gap-4 flex-wrap">
              <CraftingGrid
                ingredients={step.ingredients}
                operations={step.operations}
                itemId={step.id}
                slotSize={52}
                showStacks={showStacks}
              />

              <span className="text-2xl text-muted-foreground select-none">→</span>

              <div className="flex flex-col items-center gap-1">
                <ItemSlot
                  itemId={step.id}
                  itemName={step.name}
                  amount={fmtCount(step.totalProduced, showStacks)}
                  size={64}
                />
                <span className="text-xs text-center text-foreground/80 max-w-[80px] leading-tight">
                  {step.name}
                </span>
              </div>
            </div>

            {/* Final result badge */}
            {isLast && (
              <div className="mt-3 text-xs text-primary font-semibold uppercase tracking-wide">
                ★ End Result
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
