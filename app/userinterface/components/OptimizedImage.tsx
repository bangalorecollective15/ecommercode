"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";

interface OptimizedImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
}

export default function OptimizedImage({
  src,
  alt,
  className = "",
  priority = false,
  fill = true,
  width,
  height,
  sizes = "100vw",
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setErrored(false);
  }, [src]);

  if (!src || errored) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
        <ImageOff className="text-slate-300" size={28} />
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className={`absolute inset-0 bg-slate-100 animate-pulse ${fill ? "" : className}`} />
      )}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={`${className} transition-opacity duration-500 ease-out ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}