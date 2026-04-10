'use client';
import NextImage from 'next/image';

/**
 * Uses plain <img> for local /uploads/ paths (avoids Next.js optimization issues on VPS)
 * Uses next/image for external URLs (Cloudinary, Google, etc.)
 */
export default function SmartImage({ src, alt = '', fill, width, height, className, style, ...props }) {
  if (!src) return null;

  const isLocal = src.startsWith('/uploads/') || src.startsWith('/public/');

  if (isLocal) {
    if (fill) {
      return (
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 w-full h-full ${className || ''}`}
          style={{ objectFit: 'cover', ...style }}
          {...props}
        />
      );
    }
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        {...props}
      />
    );
  }

  // External URL — use Next.js Image
  return (
    <NextImage
      src={src}
      alt={alt}
      fill={fill}
      width={!fill ? (width || 100) : undefined}
      height={!fill ? (height || 100) : undefined}
      className={className}
      style={style}
      {...props}
    />
  );
}
