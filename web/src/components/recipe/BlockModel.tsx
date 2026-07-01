'use client';
import React from 'react';

interface BlockModelProps {
  src: string;
  alt: string;
  size: number;
}

/**
 * Renders a Minecraft block texture as an isometric 3D cube.
 *
 * CSS 3D coordinate notes (left-handed, Y points down):
 *   rotateX(+90°) → local Z points to world -Y (up) → translateZ puts face at top ✓
 *   rotateX(-90°) → local Z points to world +Y (down) → translateZ puts face at bottom ✗
 *   rotateY(-45°) → front (z+) and right (x+) both face viewer; left (x-) is backface-culled ✓
 *   rotateY(+45°) → front (z+) and left (x-) face viewer; right (x+) is culled (wrong side)
 */
export function BlockModel({ src, alt, size }: BlockModelProps) {
  const face = Math.round(size * 0.54);
  const half = face / 2;

  const faceBase: React.CSSProperties = {
    position: 'absolute',
    width: face,
    height: face,
    backgroundImage: `url(${src})`,
    backgroundSize: '100% 100%',
    imageRendering: 'pixelated',
  };

  return (
    <div
      title={alt}
      style={{
        width: size,
        height: size,
        position: 'relative',
        perspective: '800px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: face,
          height: face,
          // translate(-50%,-35%) centers; rotateX then rotateY gives true isometric
          transform: `translate(-50%, -35%) rotateX(-35.264deg) rotateY(-45deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Top face — brightest (rotateX(+90°) → local Z → world up) */}
        <div
          style={{
            ...faceBase,
            transform: `rotateX(90deg) translateZ(${half}px)`,
            filter: 'brightness(1.4)',
          }}
        />
        {/* Front face — medium (left side of isometric block from viewer) */}
        <div
          style={{
            ...faceBase,
            transform: `translateZ(${half}px)`,
            filter: 'brightness(0.85)',
          }}
        />
        {/* Right face — darkest (right side of isometric block from viewer) */}
        <div
          style={{
            ...faceBase,
            transform: `rotateY(90deg) translateZ(${half}px)`,
            filter: 'brightness(0.6)',
          }}
        />
      </div>
    </div>
  );
}
