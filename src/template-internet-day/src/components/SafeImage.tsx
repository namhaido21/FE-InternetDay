import { useState } from 'react'

interface SafeImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
}

/** Renders nothing when the URL is empty or broken, so a bad upload cannot leave a broken icon. */
export function SafeImage({ src, alt, className, width, height }: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState('')
  if (!src || failedSrc === src) return null
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={() => setFailedSrc(src)}
    />
  )
}
