'use client';
import React from 'react';
import textureMeta from '@/lib/texture_meta.json';

interface FaceMeta {
  imgW: number;
  imgH: number;
  faceSize: number;
  top: number[];
  front: number[];
  right: number[];
}

const meta = textureMeta as Record<string, FaceMeta>;

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
  const fm = meta[src] as FaceMeta | undefined;

  function cubemapFace(coords: number[]): React.CSSProperties {
    const scale = face / fm!.faceSize;
    return {
      backgroundImage: `url(${src})`,
      backgroundSize: `${fm!.imgW * scale}px ${fm!.imgH * scale}px`,
      backgroundPosition: `${-coords[0] * scale}px ${-coords[1] * scale}px`,
      backgroundRepeat: 'no-repeat',
      imageRendering: 'pixelated',
    };
  }

  const singleFace: React.CSSProperties = {
    backgroundImage: `url(${src})`,
    backgroundSize: '100% 100%',
    imageRendering: 'pixelated',
  };

  const topStyle = fm ? cubemapFace(fm.top) : singleFace;
  const frontStyle = fm ? cubemapFace(fm.front) : singleFace;
  const rightStyle = fm ? cubemapFace(fm.right) : singleFace;

  const faceBase: React.CSSProperties = {
    position: 'absolute',
    width: face,
    height: face,
  };

  return (
    <div title={alt} style={{ width: size, height: size, position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: face,
          height: face,
          transform: `translate(-50%, -45%) perspective(800px) rotateX(-35.264deg) rotateY(-45deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Top face — brightest */}
        <div
          style={{
            ...faceBase,
            ...topStyle,
            transform: `rotateX(90deg) translateZ(${half}px)`,
            filter: 'brightness(1.4)',
          }}
        />
        {/* Front face — medium */}
        <div
          style={{
            ...faceBase,
            ...frontStyle,
            transform: `translateZ(${half}px)`,
            filter: 'brightness(0.85)',
          }}
        />
        {/* Right face — darkest */}
        <div
          style={{
            ...faceBase,
            ...rightStyle,
            transform: `rotateY(90deg) translateZ(${half}px)`,
            filter: 'brightness(0.6)',
          }}
        />
      </div>
    </div>
  );
}
