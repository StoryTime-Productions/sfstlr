import { NextRequest, NextResponse } from 'next/server';
import { loadItems } from '@sfstlr/data';
import { resolve, cleanName } from '@sfstlr/resolver';

// Levenshtein for fuzzy suggestions on bad IDs (same logic as CLI)
function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[a.length][b.length];
}

let itemsCache: Map<string, unknown> | null = null;

async function getItems() {
  if (!itemsCache) itemsCache = await loadItems(false);
  return itemsCache;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.items || !Array.isArray(body.items)) {
    return NextResponse.json({ error: 'Expected { items: [{id, amount}] }' }, { status: 400 });
  }

  const items = await getItems();

  // Validate all IDs upfront
  const invalid: { id: string; suggestions: string[] }[] = [];
  for (const t of body.items) {
    const id = String(t.id).toUpperCase();
    if (!(items as Map<string, unknown>).has(id)) {
      const ids = [...(items as Map<string, unknown>).keys()] as string[];
      const suggestions = ids
        .map((k) => ({ id: k, dist: levenshtein(id, k) }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 5)
        .map((m) => m.id);
      invalid.push({ id, suggestions });
    }
  }

  if (invalid.length > 0) {
    return NextResponse.json({ error: 'Unknown item IDs', invalid }, { status: 400 });
  }

  const targets = body.items.map((t: { id: string; amount: number }) => ({
    id: String(t.id).toUpperCase(),
    amount: Math.max(1, parseInt(t.amount as unknown as string, 10) || 1),
    name: cleanName(
      (items as Map<string, { name: string }>).get(String(t.id).toUpperCase())?.name ?? ''
    ),
  }));

  const useAltRecipes = body.useAltRecipes !== false;
  const result = resolve(targets, items as Map<string, object>, { useAltRecipes });

  return NextResponse.json({
    targets,
    steps: result.steps,
    rawMaterials: Object.fromEntries(result.rawMaterials),
    warnings: result.warnings,
  });
}

// Also support GET with ?items=ITEM_ID:AMOUNT,ITEM_ID:AMOUNT for easy browser testing
export async function GET(req: NextRequest) {
  const param = req.nextUrl.searchParams.get('items');
  if (!param) return NextResponse.json({ error: 'Use ?items=ITEM_ID:AMOUNT' }, { status: 400 });

  const items_param = param.split(',').map((s) => {
    const [id, amount] = s.split(':');
    return { id, amount: parseInt(amount ?? '1', 10) || 1 };
  });
  const useAltRecipes = req.nextUrl.searchParams.get('useAltRecipes') !== 'false';

  return POST(
    new NextRequest(req.url, {
      method: 'POST',
      body: JSON.stringify({ items: items_param, useAltRecipes }),
      headers: { 'content-type': 'application/json' },
    })
  );
}
