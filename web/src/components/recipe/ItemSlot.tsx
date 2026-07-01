'use client';
import { getTexturePath, getSpriteFrames, isBlockTexture, SLOT_EMPTY } from '@/lib/texture';
import { cn } from '@/lib/utils';
import { AnimatedSprite } from './AnimatedSprite';
import { BlockModel } from './BlockModel';

interface ItemSlotProps {
  itemId?: string;
  itemName?: string;
  amount?: number | string;
  size?: number; // px, default 64
  className?: string;
}

export function ItemSlot({ itemId, itemName, amount, size = 64, className }: ItemSlotProps) {
  const src = itemId ? getTexturePath(itemId) : SLOT_EMPTY;
  const isEmpty = !itemId;
  const showBlock = !isEmpty && isBlockTexture(itemId ?? '', src);
  const frames = !isEmpty && !showBlock ? getSpriteFrames(itemId ?? '') : 1;
  const isAnimated = frames > 1;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center border border-border bg-secondary',
        className
      )}
      style={{ width: size, height: size, flexShrink: 0 }}
      title={itemName ? `${itemName}${amount && amount !== 1 ? ` x${amount}` : ''}` : undefined}
    >
      {showBlock ? (
        <BlockModel src={src} alt={itemName ?? ''} size={size} />
      ) : isAnimated ? (
        <AnimatedSprite src={src} alt={itemName ?? ''} size={size} frameCount={frames} />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={itemName ?? ''}
          width={size}
          height={size}
          style={{ imageRendering: 'pixelated', opacity: isEmpty ? 0.25 : 1 }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = SLOT_EMPTY;
          }}
        />
      )}
      {amount !== undefined && amount !== 1 && amount !== '1' && (
        <span
          className="absolute bottom-0.5 right-1 text-white font-bold leading-none select-none"
          style={{ fontSize: Math.max(10, size / 5), textShadow: '1px 1px 0 #000' }}
        >
          {amount}
        </span>
      )}
    </div>
  );
}
