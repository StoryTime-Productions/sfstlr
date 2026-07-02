'use client';
import { useEffect, useRef } from 'react';

interface AnimatedSpriteProps {
  src: string;
  alt: string;
  size: number;
  frameCount: number;
  /** ms per frame — Minecraft default is 50ms (20 fps) */
  frameDuration?: number;
}

export function AnimatedSprite({
  src,
  alt,
  size,
  frameCount,
  frameDuration = 50,
}: AnimatedSpriteProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    const id = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % frameCount;
      el.style.backgroundPositionY = `-${frameRef.current * size}px`;
    }, frameDuration);
    return () => clearInterval(id);
  }, [frameCount, frameDuration, size]);

  return (
    <div
      ref={divRef}
      title={alt}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${src})`,
        backgroundSize: `${size}px ${size * frameCount}px`,
        backgroundPositionY: '0px',
        imageRendering: 'pixelated',
      }}
    />
  );
}
