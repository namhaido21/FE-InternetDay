import { useState } from 'react'
import { PORTRAIT_POSTER_MEDIA } from '../config'

interface PosterArtProps {
  src: string
  mobileSrc: string
}

/** Artwork behind the form; decorative, so a missing or broken file just leaves the page color. */
export function PosterArt({ src, mobileSrc }: PosterArtProps) {
  const fallback = src || mobileSrc
  const [failed, setFailed] = useState('')
  if (!fallback || failed === fallback) return null

  return (
    <picture className="rp-poster__art">
      {mobileSrc && <source media={PORTRAIT_POSTER_MEDIA} srcSet={mobileSrc} />}
      <img src={fallback} alt="" decoding="async" onError={() => setFailed(fallback)} />
    </picture>
  )
}
