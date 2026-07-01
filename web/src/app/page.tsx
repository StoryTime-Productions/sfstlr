'use client';
import { useState, useEffect, useCallback } from 'react';
import { StepCard } from '@/components/recipe/StepCard';
import { ItemSlot } from '@/components/recipe/ItemSlot';
import { ItemSearch } from '@/components/recipe/ItemSearch';
import { fmtCount } from '@/lib/format';

interface Target {
  id: string;
  amount: number;
}
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
  ingredients: Ingredient[];
}
interface ResolveResult {
  targets: (Target & { name: string })[];
  steps: Step[];
  rawMaterials: Record<string, number>;
  warnings: string[];
}

function encodeTargets(targets: Target[]): string {
  return targets.map((t) => `${t.id}:${t.amount}`).join(',');
}

function decodeTargets(param: string): Target[] {
  return param.split(',').flatMap((s) => {
    const [id, amt] = s.trim().split(':');
    if (!id) return [];
    return [{ id: id.toUpperCase(), amount: parseInt(amt) || 1 }];
  });
}

export default function Home() {
  const [inputId, setInputId] = useState('');
  const [inputAmount, setInputAmount] = useState(1);
  const [targets, setTargets] = useState<Target[]>([]);
  const [result, setResult] = useState<ResolveResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState<boolean | undefined>(undefined);
  const [showStacks, setShowStacks] = useState(false);
  const [copied, setCopied] = useState(false);

  const calculate = useCallback(async (targetList: Target[]) => {
    if (targetList.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: targetList }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.invalid
          ? data.invalid
              .map(
                (e: { id: string; suggestions: string[] }) =>
                  `"${e.id}" not found. Did you mean: ${e.suggestions.slice(0, 3).join(', ')}?`
              )
              .join('\n')
          : data.error;
        setError(msg);
      } else {
        setResult(data);
        const param = encodeTargets(targetList);
        window.history.replaceState(null, '', `/?items=${encodeURIComponent(param)}`);
      }
    } catch {
      setError('Network error — is the dev server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: parse ?items= and auto-calculate
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('items');
    if (!raw) return;
    const parsed = decodeTargets(raw);
    if (parsed.length === 0) return;
    setTargets(parsed);
    calculate(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addTarget() {
    const id = inputId.trim().toUpperCase();
    if (!id) return;
    setTargets((prev) => [...prev, { id, amount: Math.max(1, inputAmount) }]);
    setInputId('');
    setInputAmount(1);
  }

  function removeTarget(idx: number) {
    setTargets((prev) => prev.filter((_, i) => i !== idx));
  }

  function shareUrl() {
    const param = encodeTargets(targets);
    const url = `${window.location.origin}/?items=${encodeURIComponent(param)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const rawEntries = result
    ? Object.entries(result.rawMaterials).sort(([, a], [, b]) => b - a)
    : [];

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight">SFSTLR</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Slimefun raw materials &amp; step-by-step recipe calculator
        </p>
      </div>

      {/* Search */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex gap-2 flex-wrap mb-3">
          <ItemSearch
            className="flex-1 min-w-[200px]"
            placeholder="Item ID or name…  e.g. reinforced alloy"
            value={inputId}
            onChange={setInputId}
            onSelect={(id) => {
              setInputId(id);
            }}
          />
          <input
            type="number"
            min={1}
            className="w-20 bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={inputAmount}
            onChange={(e) => setInputAmount(parseInt(e.target.value) || 1)}
          />
          <button
            onClick={addTarget}
            className="px-4 py-2 rounded bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent transition-colors"
          >
            + Add
          </button>
        </div>

        {/* Target list */}
        {targets.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {targets.map((t, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 bg-muted text-foreground text-xs px-2 py-1 rounded"
              >
                {t.id} ×{t.amount}
                <button
                  onClick={() => removeTarget(i)}
                  className="text-muted-foreground hover:text-destructive ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => calculate(targets)}
            disabled={targets.length === 0 || loading}
            className="px-6 py-2 rounded bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {loading ? 'Calculating…' : 'Calculate'}
          </button>
          {result && (
            <button
              onClick={shareUrl}
              className="px-4 py-2 rounded bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent transition-colors"
            >
              {copied ? 'Copied!' : 'Share'}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/15 border border-destructive text-destructive rounded-lg p-4 mb-6 text-sm whitespace-pre-wrap">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="flex gap-6 flex-col lg:flex-row items-start">
          {/* Raw Materials — sticky sidebar */}
          <div className="lg:sticky lg:top-6 w-full lg:w-64 shrink-0">
            <div className="bg-card border border-border rounded-lg p-4">
              <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                Raw Materials
              </h2>
              <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
                {rawEntries.map(([name, amount]) => (
                  <div key={name} className="flex items-center gap-2">
                    <ItemSlot itemId={name} itemName={name} size={28} />
                    <span className="text-xs text-foreground flex-1 truncate" title={name}>
                      {name}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground shrink-0">
                      ×{fmtCount(amount, showStacks)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recipe Steps */}
          <div className="flex-1 min-w-0">
            {result.warnings.length > 0 && (
              <div className="text-xs text-muted-foreground mb-4 space-y-1">
                {result.warnings.map((w, i) => (
                  <div key={i}>⚠ {w}</div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Recipe Steps
                <span className="text-muted-foreground font-normal ml-2 normal-case">
                  (top = first to craft · bottom = end result)
                </span>
              </h2>
              <div className="flex gap-1.5 ml-auto">
                <button
                  onClick={() => setShowStacks((s) => !s)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${showStacks ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                >
                  {showStacks ? 'Stacks' : 'Items'}
                </button>
                <button
                  onClick={() => setAllExpanded(true)}
                  className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  Expand all
                </button>
                <button
                  onClick={() => setAllExpanded(false)}
                  className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  Collapse all
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {result.steps.map((step, i) => (
                <StepCard
                  key={step.id}
                  step={step}
                  isLast={i === result.steps.length - 1}
                  forceExpanded={allExpanded}
                  showStacks={showStacks}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="text-center text-muted-foreground text-sm mt-16">
          Enter a Slimefun item ID above to see its full recipe and raw materials.
        </div>
      )}
    </main>
  );
}
