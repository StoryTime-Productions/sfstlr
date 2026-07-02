'use client';
import { useState } from 'react';
import { ItemSlot } from '@/components/recipe/ItemSlot';
import textureIndex from '../../../public/textures/index.json';

const ALL_IDS = Object.keys(textureIndex as Record<string, string>);

export default function DebugPage() {
  const [filter, setFilter] = useState('');

  const filtered = filter ? ALL_IDS.filter((id) => id.includes(filter.toLowerCase())) : ALL_IDS;

  return (
    <main className="min-h-screen p-6 max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-1">Texture Debug</h1>
      <p className="text-muted-foreground text-xs mb-4">
        {filtered.length} / {ALL_IDS.length} items
      </p>

      <input
        type="text"
        placeholder="Filter by key…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full max-w-sm bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-6"
      />

      <div className="flex flex-wrap gap-2">
        {filtered.map((id) => (
          <div key={id} className="flex flex-col items-center gap-1 w-16" title={id}>
            <ItemSlot itemId={id} itemName={id} size={48} />
            <span className="text-[9px] text-muted-foreground text-center leading-tight break-all w-full">
              {id}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
