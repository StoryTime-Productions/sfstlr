'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface Suggestion {
  id: string;
  name: string;
}

interface ItemSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (id: string) => void;
  placeholder?: string;
  className?: string;
}

export function ItemSearch({ value, onChange, onSelect, placeholder, className }: ItemSearchProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/items?q=${encodeURIComponent(q)}`);
        const data: Suggestion[] = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
        setHighlightedIdx(-1);
      } catch {
        /* ignore */
      }
    }, 150);
  }, []);

  useEffect(() => {
    fetchSuggestions(value);
  }, [value, fetchSuggestions]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && highlightedIdx >= 0) {
      e.preventDefault();
      pick(suggestions[highlightedIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function pick(s: Suggestion) {
    onSelect(s.id);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <input
        className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder={placeholder ?? 'Item ID or name…'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              className={cn(
                'px-3 py-2 cursor-pointer text-sm flex items-center justify-between gap-2',
                i === highlightedIdx
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-muted text-foreground'
              )}
              onMouseDown={() => pick(s)}
              onMouseEnter={() => setHighlightedIdx(i)}
            >
              <span className="truncate">{s.name}</span>
              <span className="text-xs text-muted-foreground font-mono shrink-0">{s.id}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
