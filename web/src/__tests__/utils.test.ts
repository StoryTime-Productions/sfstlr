import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('cn', () => {
  it('returns a single class unchanged', () => {
    expect(cn('foo')).toBe('foo');
  });

  it('merges multiple classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('drops falsy values', () => {
    expect(cn('foo', false && 'bar', null, undefined, 'baz')).toBe('foo baz');
  });

  it('resolves Tailwind conflicts (last wins)', () => {
    // twMerge keeps the last conflicting utility
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('handles conditional object syntax', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500');
  });

  it('handles an empty call', () => {
    expect(cn()).toBe('');
  });
});
