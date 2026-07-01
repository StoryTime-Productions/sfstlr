/** Format an item count either as a raw integer or as stacks (÷64). */
export function fmtCount(n: number, stacks: boolean): string | number {
  if (!stacks) return n;
  const s = Math.floor(n / 64);
  const r = n % 64;
  if (s === 0) return r;
  if (r === 0) return `${s}s`;
  return `${s}s+${r}`;
}
