import { NextRequest, NextResponse } from 'next/server';
import { loadItems } from '@sfstlr/data';
import { cleanName } from '@sfstlr/resolver';

let itemsCache: Map<string, { id: string; name: string }> | null = null;
let searchList: { id: string; name: string }[] | null = null;

async function getSearchList() {
  if (searchList) return searchList;
  itemsCache = await loadItems(false);
  searchList = [...itemsCache!.values()].map((item: { id: string; name: string }) => ({
    id: item.id,
    name: cleanName(item.name),
  }));
  return searchList;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim().toLowerCase() ?? '';
  if (q.length < 2) return NextResponse.json([]);

  const list = await getSearchList();

  const startMatches: { id: string; name: string }[] = [];
  const containsMatches: { id: string; name: string }[] = [];

  for (const item of list) {
    const idLower = item.id.toLowerCase();
    const nameLower = item.name.toLowerCase();
    const idMatch = idLower.includes(q);
    const nameMatch = nameLower.includes(q);
    if (!idMatch && !nameMatch) continue;

    const startsWithMatch = idLower.startsWith(q) || nameLower.startsWith(q);
    if (startsWithMatch) startMatches.push(item);
    else containsMatches.push(item);

    if (startMatches.length + containsMatches.length >= 20) break;
  }

  return NextResponse.json([...startMatches, ...containsMatches].slice(0, 10));
}
